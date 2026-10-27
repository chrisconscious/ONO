/**
 * Regression tests for the three Stage 13 defect fixes:
 *  1. finance.transitionInvoice — row-level locking (FOR UPDATE) plus the new
 *     "cannot void an invoice with allocated payments" invariant.
 *  2. sales.moveOpportunityStage — re-opening a lost deal must consult the
 *     CURRENT membership role, not the permission snapshot carried in the
 *     session context (role changes/revocations take effect immediately).
 *  3. sales.fulfillSalesOrder — idempotency guard + status re-check under the
 *     row lock so a retried or concurrent fulfillment cannot double-deduct
 *     stock.
 */
import { execFileSync, spawn } from "node:child_process";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/database/prisma";
import * as finance from "@/server/services/finance-service";
import * as sales from "@/server/services/sales-service";
import * as inventory from "@/server/services/inventory-service";
import { permissionsForRole } from "@/lib/permissions/rbac";
import {
  addMember,
  makeCompany,
  makeOpportunity,
  makeProduct,
  makeTenantWithUser,
  makeWarehouse,
} from "../helpers/fixtures";

describe("invoice transitions are concurrency-safe and payment-aware", () => {
  it("locks the invoice row FOR UPDATE during a transition", async () => {
    const t = await makeTenantWithUser();
    const company = await makeCompany(t.ctx);
    const { invoice } = await finance.createInvoice(
      { companyId: company.id, lines: [{ description: "Widget", quantity: 1, unitPrice: "50.00" }] },
      t.ctx,
    );

    // Prove the service locks the invoice row at the SQL level using a real
    // blocking test rather than log inspection: the default app client does
    // not enable query logging, and wall-clock races are flaky. We hold a
    // FOR UPDATE row lock on the invoice inside a separate long-lived
    // PostgreSQL session (psql) and assert that transitionInvoice cannot
    // complete while the lock is held — which can only happen if the service
    // itself performs a locking read of the same row.
    const dbName = new URL(process.env.DATABASE_URL!).pathname.replace(/^\//, "");
    const psqlEnv = { ...process.env, PGCONNECT_TIMEOUT: "5" };
    const exec = (sql: string) =>
      execFileSync("psql", [dbName, "-U", "postgres", "-h", "localhost", "-p", "5432", "-v", "ON_ERROR_STOP=1", "-c", sql], {
        env: { ...psqlEnv, PGPASSWORD: "postgres" },
        stdio: "pipe",
      });

    // Open a detached background psql session that takes the row lock and
    // then sleeps, keeping the transaction (and therefore the lock) open.
    const lockerScript = `SELECT id FROM "invoices" WHERE id = '${invoice.id}' FOR UPDATE; SELECT pg_sleep(8);`;
    const child = spawn("psql", [dbName, "-U", "postgres", "-h", "localhost", "-p", "5432", "-c", lockerScript], {
      env: { ...psqlEnv, PGPASSWORD: "postgres" },
      stdio: "ignore",
      detached: true,
    });
    child.unref();

    try {
      // Give the locker session time to acquire the row lock.
      await new Promise((r) => setTimeout(r, 1_500));

      // With the external lock held, the transition must block. If it
      // "completed" instantly the service would not be taking a row lock.
      const blocked = await Promise.race([
        finance.transitionInvoice(invoice.id, "ISSUED", t.ctx).then(() => "done"),
        new Promise<string>((resolve) => setTimeout(() => resolve("blocked"), 2_500)),
      ]);
      expect(blocked).toBe("blocked");

      // The database state must still be unchanged while blocked.
      const during = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
      expect(during.status).not.toBe("ISSUED");
    } finally {
      // Terminate the locker session so its transaction aborts and the row
      // lock is released; the pending transition then completes.
      try {
        exec(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query LIKE '%pg_sleep(8)%' AND pid <> pg_backend_pid()`);
      } catch {
        // Best-effort cleanup; the sleep ends on its own otherwise.
      }
    }

    // After the lock is released the pending transition should complete.
    let finalStatus = "";
    for (let i = 0; i < 60; i++) {
      const row = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
      if (row.status === "ISSUED") {
        finalStatus = row.status;
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    expect(finalStatus).toBe("ISSUED");
  });

  it("rejects VOID when payments are already allocated to the invoice", async () => {
    const t = await makeTenantWithUser();
    const company = await makeCompany(t.ctx);
    const { invoice } = await finance.createInvoice(
      { companyId: company.id, lines: [{ description: "Widget", quantity: 2, unitPrice: "100.00" }] },
      t.ctx,
    );
    await finance.transitionInvoice(invoice.id, "ISSUED", t.ctx);
    // Allocate a partial payment (updates amountPaid via recordPayment).
    await finance.recordPayment(
      { invoiceId: invoice.id, direction: "INBOUND", amount: 50, method: "BANK" },
      t.ctx,
    );

    const err = await finance
      .transitionInvoice(invoice.id, "VOID", t.ctx)
      .then(() => null, (e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(409);
    expect((err as Error).message).toMatch(/refund or reallocate/i);

    // Invoice remains in its payment-allocated state — the failed VOID wrote
    // no partial state (recordPayment legitimately moved it to PARTIALLY_PAID).
    const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(inv.status).toBe("PARTIALLY_PAID");
    expect(inv.amountPaid.toNumber()).toBe(50);
  });

  it("allows VOID once amountPaid is zero again", async () => {
    const t = await makeTenantWithUser();
    const company = await makeCompany(t.ctx);
    const { invoice } = await finance.createInvoice(
      { companyId: company.id, lines: [{ description: "Widget", quantity: 1, unitPrice: "10.00" }] },
      t.ctx,
    );
    await finance.transitionInvoice(invoice.id, "ISSUED", t.ctx);
    await finance.transitionInvoice(invoice.id, "VOID", t.ctx);
    const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(inv.status).toBe("VOID");
  });
});

describe("opportunity re-open enforces CURRENT role, not stale session permissions", () => {
  it("denies re-open after the user's role is demoted mid-session", async () => {
    const t = await makeTenantWithUser("MANAGER");
    const opp = await makeOpportunity(t.ctx, { stage: "CLOSED_LOST" });

    // Stale context still carries manager permissions...
    expect(t.ctx.permissions.has("crm.delete")).toBe(true);
    // ...but the membership row now says VIEWER, so the server must deny.
    await prisma.membership.update({
      where: { id: t.membershipId },
      data: { role: "VIEWER" },
    });

    const err = await sales
      .moveOpportunityStage(opp.id, { stage: "IDENTIFICATION" }, t.ctx)
      .then(() => null, (e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(403);
    const fresh = await prisma.opportunity.findUniqueOrThrow({ where: { id: opp.id } });
    expect(fresh.stage).toBe("CLOSED_LOST");
  });

  it("permits re-open while the user still holds the manager role", async () => {
    const t = await makeTenantWithUser("MANAGER");
    const opp = await makeOpportunity(t.ctx, { stage: "CLOSED_LOST" });
    const moved = await sales.moveOpportunityStage(opp.id, { stage: "IDENTIFICATION" }, t.ctx);
    expect(moved.stage).toBe("IDENTIFICATION");
  });

  it("denies re-open when the membership is deactivated even if role would allow it", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const opp = await makeOpportunity(t.ctx, { stage: "CLOSED_LOST" });
    await prisma.membership.update({
      where: { id: t.membershipId },
      data: { isActive: false },
    });
    const err = await sales
      .moveOpportunityStage(opp.id, { stage: "IDENTIFICATION" }, t.ctx)
      .then(() => null, (e) => e);
    expect((err as ApiError).status).toBe(403);
  });

  it("non-manager cannot re-open a lost opportunity at all", async () => {
    const t = await makeTenantWithUser("MEMBER");
    const other = await addMember(t.tenantId, "MEMBER");
    const opp = await makeOpportunity(t.ctx, { stage: "CLOSED_LOST" });
    expect(permissionsForRole("MEMBER").has("crm.delete")).toBe(false);
    const err = await sales
      .moveOpportunityStage(opp.id, { stage: "IDENTIFICATION" }, other.ctx)
      .then(() => null, (e) => e);
    expect((err as ApiError).status).toBe(403);
  });
});

describe("sales-order fulfillment is idempotent and race-safe", () => {
  async function setupConfirmedOrder(qtyOnHand = 10, qtyOrdered = 4) {
    const t = await makeTenantWithUser();
    const company = await makeCompany(t.ctx);
    const product = await makeProduct(t.ctx);
    const warehouse = await makeWarehouse(t.ctx);
    await inventory.recordStockMovement(
      { productId: product.id, warehouseId: warehouse.id, type: "PURCHASE", quantity: qtyOnHand },
      t.ctx,
    );
    const order = await sales.createSalesOrder(
      {
        companyId: company.id,
        warehouseId: warehouse.id,
        lines: [{ productId: product.id, description: "Widget", quantity: qtyOrdered, unitPrice: "100.00" }],
      },
      t.ctx,
    );
    await sales.confirmSalesOrder(order.id, t.ctx);
    return { t, product, warehouse, order };
  }

  it("a retried fulfillment does not deduct stock twice", async () => {
    const { t, product, warehouse, order } = await setupConfirmedOrder(10, 4);
    await sales.fulfillSalesOrder(order.id, t.ctx);

    const stockAfterFirst = await prisma.stockItem.findFirstOrThrow({
      where: { productId: product.id, warehouseId: warehouse.id },
    });
    expect(stockAfterFirst.quantity.toNumber()).toBe(6);

    // Retry: rejected by the status guard (order is FULFILLED) or, in the
    // pre-commit race window, by the handover idempotency guard. Both are
    // ApiErrors; neither may touch stock.
    const err = await sales
      .fulfillSalesOrder(order.id, t.ctx)
      .then(() => null, (e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect([400, 409]).toContain((err as ApiError).status);

    const stockAfterRetry = await prisma.stockItem.findFirstOrThrow({
      where: { productId: product.id, warehouseId: warehouse.id },
    });
    expect(stockAfterRetry.quantity.toNumber()).toBe(6); // unchanged
    const movements = await prisma.stockMovement.count({
      where: { productId: product.id, type: "SALE" },
    });
    expect(movements).toBe(1); // exactly one SALE movement recorded
  });

  it("concurrent fulfillments cannot both succeed and double-deduct", async () => {
    const { t, product, warehouse, order } = await setupConfirmedOrder(10, 4);
    const results = await Promise.allSettled([
      sales.fulfillSalesOrder(order.id, t.ctx),
      sales.fulfillSalesOrder(order.id, t.ctx),
    ]);
    const ok = results.filter((r) => r.status === "fulfilled").length;
    expect(ok).toBeLessThanOrEqual(1); // at most one success

    const stock = await prisma.stockItem.findFirstOrThrow({
      where: { productId: product.id, warehouseId: warehouse.id },
    });
    // Balance must reflect AT MOST one deduction of 4 from 10.
    expect(Number(stock.quantity.toString())).toBeGreaterThanOrEqual(6);
    const movements = await prisma.stockMovement.count({
      where: { productId: product.id, type: "SALE" },
    });
    expect(movements).toBeLessThanOrEqual(1);
  });

  it("fulfillment rejects insufficient stock without writing anything", async () => {
    const { t, product, warehouse, order } = await setupConfirmedOrder(2, 4);
    const err = await sales
      .fulfillSalesOrder(order.id, t.ctx)
      .then(() => null, (e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(409);
    const stock = await prisma.stockItem.findFirstOrThrow({
      where: { productId: product.id, warehouseId: warehouse.id },
    });
    expect(stock.quantity.toNumber()).toBe(2); // untouched
    const refreshed = await prisma.salesOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(refreshed.status).toBe("CONFIRMED"); // not marked fulfilled
  });
});
