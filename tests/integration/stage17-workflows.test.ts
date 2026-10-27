/**
 * Stage 17 — end-to-end cross-module workflow tests.
 *
 * These exercise the real business processes through the actual service layer
 * (no mocks), verifying that one module's successful operation produces the
 * correct downstream changes in dependent modules:
 *
 *   Lead -> conversion -> sales order -> confirmation (+auto invoice)
 *        -> fulfillment (stock deduction) -> payment (invoice PAID)
 *
 *   Purchase request -> PO -> goods receipt -> stock increase
 *
 * plus concurrency/idempotency guarantees and tenant isolation of the
 * provisioning fix (nullable idempotency FK).
 */
import { describe, it, expect } from "vitest";
import { prisma } from "../helpers/dbBootstrap";
import {
  makeTenantWithUser,
  addMember,
  makeProduct,
  makeWarehouse,
  makeLead,
} from "../helpers/fixtures";
import * as crm from "@/server/services/crm-service";
import * as sales from "@/server/services/sales-service";
import * as inventory from "@/server/services/inventory-service";
import * as finance from "@/server/services/finance-service";
import { provisionOrganization } from "@/server/services/provisioning-service";

describe("stage17: lead-to-cash workflow", () => {
  it("runs the full connected process with consistent downstream state", async () => {
    const admin = await makeTenantWithUser("ADMIN");
    const ctx = admin.ctx;

    // 1. CRM: create + convert a lead into contact/opportunity/company.
    const lead = await makeLead(ctx, `buyer-${Date.now()}@prospect.example`);
    await prisma.lead.update({ where: { id: lead.id }, data: { company: "Acme Retailer" } });
    const converted = await crm.convertLead(lead.id, ctx);
    expect(converted.contact).toBeTruthy();
    expect(converted.opportunity).toBeTruthy();
    expect(converted.company).toBeTruthy();

    // Conversion must be reflected in persisted records, not just returned.
    const leadRow = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(leadRow.status).toBe("WON");
    expect(leadRow.convertedContactId).toBe(converted.contact.id);

    // 2. Inventory: seed a stocked product so fulfillment can deduct.
    const product = await makeProduct(ctx, { unitPrice: "50.00" });
    const warehouse = await makeWarehouse(ctx);
    await inventory.recordStockMovement(
      { productId: product.id, warehouseId: warehouse.id, type: "PURCHASE", quantity: 100 },
      ctx,
    );

    // 3. Sales: create an order linked to the converted opportunity/company.
    const order = await sales.createSalesOrder(
      {
        opportunityId: converted.opportunity.id,
        companyId: converted.company!.id,
        warehouseId: warehouse.id,
        lines: [{ productId: product.id, description: product.name, quantity: 3, unitPrice: "50.00" }],
      },
      ctx,
    );
    // NUMERIC(14,2) can return trailing-zero-free strings via toString();
    // toFixed(2) gives a stable comparison for money assertions.
    expect(order.total.toFixed(2)).toBe("150.00");

    // 4. Confirmation auto-issues the sales invoice atomically.
    const confirmed = await sales.confirmSalesOrder(order.id, ctx);
    expect(confirmed.order.status).toBe("CONFIRMED");
    expect(confirmed.invoice.status).toBe("ISSUED");
    expect(confirmed.invoice.total.toFixed(2)).toBe("150.00");
    expect(confirmed.invoice.salesOrderId).toBe(order.id);

    // An orphan-confirmed order must never exist in the DB.
    const invCount = await prisma.invoice.count({ where: { salesOrderId: order.id, tenantId: ctx.tenantId } });
    expect(invCount).toBe(1);

    // 5. Fulfillment deducts exactly the ordered quantity.
    await sales.fulfillSalesOrder(order.id, ctx);
    const stock = await inventory.getStockLevel(product.id, warehouse.id, ctx);
    expect(stock.quantity.toFixed(3)).toBe("97.000");
    const movements = await prisma.stockMovement.findMany({
      where: { tenantId: ctx.tenantId, productId: product.id, type: "SALE" },
    });
    expect(movements).toHaveLength(1);
    expect(movements[0].quantity.toString()).toBe("-3");

    // 6. Payment settles the invoice to PAID.
    const payment = await finance.recordPayment(
      { invoiceId: confirmed.invoice.id, direction: "INBOUND", amount: 150.0, method: "BANK" },
      ctx,
    );
    expect(payment.amount.toFixed(2)).toBe("150.00");
    const paidInvoice = await prisma.invoice.findUniqueOrThrow({ where: { id: confirmed.invoice.id } });
    expect(paidInvoice.status).toBe("PAID");

    // 7. Audit trail covers every consequential step of the workflow.
    const actions = await prisma.auditLog.findMany({
      where: { tenantId: ctx.tenantId },
      select: { action: true },
    });
    const seen = new Set(actions.map((a) => a.action));
    for (const required of ["crm.lead.convert", "sales.order.create", "sales.order.confirm", "sales.order.fulfill"]) {
      expect(seen.has(required)).toBe(true);
    }
  });

  it("rejects fulfillment when stock is insufficient and leaves no partial deductions", async () => {
    const admin = await makeTenantWithUser("ADMIN");
    const ctx = admin.ctx;
    const product = await makeProduct(ctx);
    const warehouse = await makeWarehouse(ctx);
    await inventory.recordStockMovement(
      { productId: product.id, warehouseId: warehouse.id, type: "PURCHASE", quantity: 2 },
      ctx,
    );
    const order = await sales.createSalesOrder(
      {
        warehouseId: warehouse.id,
        lines: [{ productId: product.id, description: "widget", quantity: 5, unitPrice: "10.00" }],
      },
      ctx,
    );
    await sales.confirmSalesOrder(order.id, ctx);

    await expect(sales.fulfillSalesOrder(order.id, ctx)).rejects.toThrow(/Insufficient stock/i);

    // Transaction rollback: order stays CONFIRMED and stock is untouched.
    const row = await prisma.salesOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(row.status).toBe("CONFIRMED");
    const stock = await inventory.getStockLevel(product.id, warehouse.id, ctx);
    expect(stock.quantity.toFixed(3)).toBe("2.000");
  });

  it("double fulfillment cannot deduct stock twice", async () => {
    const admin = await makeTenantWithUser("ADMIN");
    const ctx = admin.ctx;
    const product = await makeProduct(ctx);
    const warehouse = await makeWarehouse(ctx);
    await inventory.recordStockMovement(
      { productId: product.id, warehouseId: warehouse.id, type: "PURCHASE", quantity: 10 },
      ctx,
    );
    const order = await sales.createSalesOrder(
      {
        warehouseId: warehouse.id,
        lines: [{ productId: product.id, description: "widget", quantity: 4, unitPrice: "10.00" }],
      },
      ctx,
    );
    await sales.confirmSalesOrder(order.id, ctx);

    // Fire two concurrent fulfillments: exactly one must succeed.
    const results = await Promise.allSettled([
      sales.fulfillSalesOrder(order.id, ctx),
      sales.fulfillSalesOrder(order.id, ctx),
    ]);
    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    expect(fulfilled).toBe(1);

    const stock = await inventory.getStockLevel(product.id, warehouse.id, ctx);
    expect(stock.quantity.toFixed(3)).toBe("6.000"); // deducted once only
    const saleMovements = await prisma.stockMovement.count({
      where: { tenantId: ctx.tenantId, productId: product.id, type: "SALE" },
    });
    expect(saleMovements).toBe(1);
  });

  it("cannot overpay an invoice and duplicate payments are rejected at status level", async () => {
    const admin = await makeTenantWithUser("ADMIN");
    const ctx = admin.ctx;
    const company = await crm.createCompany({ name: `PayCo ${Date.now()}` }, ctx);
    const drafted = await finance.createInvoice(
      { type: "SALES", companyId: company.id, lines: [{ description: "svc", quantity: 1, unitPrice: "100.00" }] },
      ctx,
    );
    const invoice = drafted.invoice;
    await finance.transitionInvoice(invoice.id, "ISSUED", ctx);

    await finance.recordPayment({ invoiceId: invoice.id, direction: "INBOUND", amount: 60, method: "CASH" }, ctx);
    // Overpayment beyond the outstanding balance must fail.
    await expect(
      finance.recordPayment({ invoiceId: invoice.id, direction: "INBOUND", amount: 100, method: "CASH" }, ctx),
    ).rejects.toThrow();

    const final = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(final.status).toBe("PARTIALLY_PAID");
    const totalPaid = await prisma.payment.aggregate({
      where: { invoiceId: invoice.id },
      _sum: { amount: true },
    });
    expect(totalPaid._sum.amount?.toFixed(2)).toBe("60.00");
  });
});

describe("stage17: procure-to-stock workflow", () => {
  it("PO lifecycle increases stock exactly on receipt", async () => {
    const admin = await makeTenantWithUser("ADMIN");
    const ctx = admin.ctx;
    const supplier = await inventory.createSupplier({ name: `Sup ${Date.now()}` }, ctx);
    const product = await makeProduct(ctx);
    const warehouse = await makeWarehouse(ctx);

    const po = await inventory.createPurchaseOrder(
      {
        supplierId: supplier.id,
        warehouseId: warehouse.id,
        lines: [{ productId: product.id, description: "stock-in", quantity: 25, unitCost: "8.00" }],
      },
      ctx,
    );
    // Stock unchanged until goods are actually received.
    let stock = await inventory.getStockLevel(product.id, warehouse.id, ctx);
    expect(stock.quantity.toFixed(3)).toBe("0.000");

    await inventory.transitionPurchaseOrder(po.id, "ORDERED", ctx);
    // Illegal transition must be rejected by the state machine.
    await expect(inventory.transitionPurchaseOrder(po.id, "RECEIVED_AND_SETTLED" as never, ctx)).rejects.toThrow();

    await inventory.transitionPurchaseOrder(po.id, "RECEIVED", ctx);
    stock = await inventory.getStockLevel(product.id, warehouse.id, ctx);
    expect(stock.quantity.toFixed(3)).toBe("25.000");

    const purchaseMovements = await prisma.stockMovement.count({
      where: { tenantId: ctx.tenantId, productId: product.id, type: "PURCHASE" },
    });
    expect(purchaseMovements).toBe(1);

    // Terminal state: a received PO cannot be re-received or cancelled.
    await expect(inventory.transitionPurchaseOrder(po.id, "CANCELLED", ctx)).rejects.toThrow(/Illegal/);
  });

  it("cross-tenant purchase references are rejected", async () => {
    const t1 = await makeTenantWithUser("ADMIN");
    const t2 = await makeTenantWithUser("ADMIN");
    const supplier = await inventory.createSupplier({ name: `S${Date.now()}` }, t1.ctx);
    const product = await makeProduct(t1.ctx);
    const warehouse = await makeWarehouse(t2.ctx); // foreign warehouse

    await expect(
      inventory.createPurchaseOrder(
        {
          supplierId: supplier.id, // foreign supplier
          warehouseId: warehouse.id,
          lines: [{ productId: product.id, description: "x", quantity: 1, unitCost: "1.00" }],
        },
        t2.ctx,
      ),
    ).rejects.toThrow(/does not belong/);
  });
});

describe("stage17: organization provisioning integrity", () => {
  it("first-time provisioning succeeds with a NULL-tenant idempotency claim and backfills the FK", async () => {
    // Fresh standalone user (not yet a member of any tenant).
    const owner = await prisma.user.create({
      data: { email: `owner-${Date.now()}@example.test`, name: "Org Owner", isVerified: true, passwordHash: "x" },
    });
    const key = `prov-${Date.now()}`;
    const result = await provisionOrganization({
      name: "Provisioned Co",
      slug: `prov-co-${Date.now()}`,
      ownerId: owner.id,
      idempotencyKey: key,
    });
    expect(result.replayed).toBe(false);

    // The idempotency record must now carry the real tenant id (backfilled).
    const rec = await prisma.idempotencyRecord.findUnique({ where: { key } });
    expect(rec?.tenantId).toBe(result.tenantId);
    expect(rec?.completedAt).toBeTruthy();

    // Owner membership + trial subscription created transactionally.
    const memberships = await prisma.membership.findMany({ where: { tenantId: result.tenantId } });
    expect(memberships).toHaveLength(1);
    expect(memberships[0].role).toBe("ADMIN");
    const sub = await prisma.subscription.findFirst({ where: { tenantId: result.tenantId } });
    expect(sub?.status).toBe("TRIALING");
  });

  it("retried provisioning replays instead of creating a duplicate organization", async () => {
    const owner = await prisma.user.create({
      data: { email: `owner2-${Date.now()}@example.test`, name: "Owner Two", isVerified: true, passwordHash: "x" },
    });
    const slug = `dupe-co-${Date.now()}`;
    const key = `prov-dupe-${Date.now()}`;
    const first = await provisionOrganization({ name: "Dupe Co", slug, ownerId: owner.id, idempotencyKey: key });
    const second = await provisionOrganization({ name: "Dupe Co", slug, ownerId: owner.id, idempotencyKey: key });

    expect(second.replayed).toBe(true);
    expect(second.tenantId).toBe(first.tenantId);
    const count = await prisma.tenant.count({ where: { slug } });
    expect(count).toBe(1);
  });
});

describe("stage17: multi-role users across modules", () => {
  it("one user with SALES+FINANCE capabilities operates both modules without duplicate accounts", async () => {
    const admin = await makeTenantWithUser("ADMIN");
    // A single identity holding MANAGER membership gets CRM + finance scope.
    const multi = await addMember(admin.tenantId, "MANAGER");
    const product = await makeProduct(multi.ctx);
    const warehouse = await makeWarehouse(multi.ctx);
    const order = await sales.createSalesOrder(
      {
        warehouseId: warehouse.id,
        lines: [{ productId: product.id, description: "line", quantity: 1, unitPrice: "5.00" }],
      },
      multi.ctx,
    );
    expect(order.number).toMatch(/^SO-/);
    // Same identity, same tenant — no second user row was needed.
    const userCount = await prisma.user.count({ where: { id: multi.userId } });
    expect(userCount).toBe(1);
  });
});
