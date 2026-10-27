/**
 * Integration tests: finance business rules — invoice math, status machine,
 * payment allocation invariants, and correction/void behavior.
 */
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import * as finance from "@/server/services/finance-service";
import { prisma } from "@/lib/database/prisma";
import { makeCompany, makeTenantWithUser, type FixtureUser } from "../helpers/fixtures";

/** Draft a SALES invoice for `t` (a company is required by business rules). */
async function draftInvoice(t: FixtureUser) {
  const company = await makeCompany(t.ctx);
  return finance.createInvoice(
    {
      companyId: company.id,
      lines: [
        { description: "Consulting", quantity: 3, unitPrice: "120.50", taxRate: 18 },
        { description: "License", quantity: 1, unitPrice: "999.99", taxRate: 0 },
      ],
    },
    t.ctx,
  );
}

describe("invoice totals (Decimal money math)", () => {
  it("computes line totals, per-line tax, and grand total with ROUND_HALF_UP", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const company = await makeCompany(t.ctx);
    const { invoice, lines } = await finance.createInvoice(
      {
        companyId: company.id,
        lines: [
          { description: "Consulting", quantity: 3, unitPrice: "120.50", taxRate: 18 },
          { description: "License", quantity: 1, unitPrice: "999.99" },
        ],
      },
      t.ctx,
    );
    // Independently calculated expectations:
    // 3 * 120.50 = 361.50; tax 18% = 65.07
    // 1 * 999.99 = 999.99; tax 0
    // subtotal 1361.49, tax 65.07, total 1426.56
    expect(lines[0].lineTotal).toBe("361.50");
    expect(lines[0].lineTax).toBe("65.07");
    expect(invoice.subtotal.toString()).toBe("1361.49");
    expect(invoice.taxAmount.toString()).toBe("65.07");
    expect(invoice.total.toString()).toBe("1426.56");
  });

  it("half-up rounding on fractional cents (0.005 rounds up)", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const company = await makeCompany(t.ctx);
    const { invoice } = await finance.createInvoice(
      { companyId: company.id, lines: [{ description: "micro", quantity: 1, unitPrice: "10.005", taxRate: 0 }] },
      t.ctx,
    );
    // NUMERIC(14,2) column + ROUND_HALF_UP computation must yield 10.01.
    expect(invoice.total.toFixed(2)).toBe("10.01");
  });

  it("assigns sequential tenant-scoped document numbers INV-00001...", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const other = await makeTenantWithUser("ADMIN");
    const a = await draftInvoice(t);
    const b = await draftInvoice(t);
    const c = await draftInvoice(other);
    expect(a.invoice.number).toBe("INV-00001");
    expect(b.invoice.number).toBe("INV-00002");
    // Numbering is per-tenant — the second org restarts at 1.
    expect(c.invoice.number).toBe("INV-00001");
  });

  it("sales invoices require a company of the same tenant", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const err = await finance
      .createInvoice({ type: "SALES", lines: [{ description: "x", quantity: 1, unitPrice: "1" }] }, t.ctx)
      .then(() => null, (e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(400);
  });
});

describe("invoice status machine", () => {
  it("allows DRAFT -> ISSUED -> PARTIALLY_PAID -> PAID", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const { invoice } = await draftInvoice(t);
    await finance.transitionInvoice(invoice.id, "ISSUED", t.ctx);
    await finance.recordPayment(
      { invoiceId: invoice.id, direction: "INBOUND", amount: "100.00", method: "BANK" },
      t.ctx,
    );
    let fresh = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(fresh.status).toBe("PARTIALLY_PAID");
    await finance.recordPayment(
      { invoiceId: invoice.id, direction: "INBOUND", amount: fresh.total.toString(), method: "CASH" },
      t.ctx,
    ).catch(() => undefined); // may exceed outstanding — checked below properly
    // Pay exact remainder instead:
    fresh = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    const remainder = fresh.total.sub(fresh.amountPaid);
    if (remainder.gt(0)) {
      await finance.recordPayment(
        { invoiceId: invoice.id, direction: "INBOUND", amount: remainder.toString(), method: "CASH" },
        t.ctx,
      );
    }
    fresh = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(fresh.status).toBe("PAID");
    expect(fresh.amountPaid.equals(fresh.total)).toBe(true);
  });

  it("rejects illegal transitions (DRAFT->PAID, PAID->VOID, VOID->anything)", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const { invoice } = await draftInvoice(t);
    const bad = await finance
      .transitionInvoice(invoice.id, "PAID", t.ctx)
      .then(() => null, (e) => e);
    expect((bad as ApiError).status).toBe(400);
    expect((bad as ApiError).message).toMatch(/Illegal invoice transition/);

    await finance.transitionInvoice(invoice.id, "ISSUED", t.ctx);
    await finance.voidInvoice(invoice.id, "issued in error", t.ctx);
    const afterVoid = await finance
      .transitionInvoice(invoice.id, "ISSUED", t.ctx)
      .then(() => null, (e) => e);
    expect((afterVoid as ApiError).status).toBe(400);
  });

  it("void requires a reason (corrections are auditable)", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const { invoice } = await draftInvoice(t);
    const err = await finance.voidInvoice(invoice.id, "   ", t.ctx).then(() => null, (e) => e);
    expect((err as ApiError).status).toBe(400);
  });

  it("cannot mark PAID before payments cover the full total", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const { invoice } = await draftInvoice(t);
    await finance.transitionInvoice(invoice.id, "ISSUED", t.ctx);
    const err = await finance.transitionInvoice(invoice.id, "PAID", t.ctx).then(() => null, (e) => e);
    expect((err as ApiError).status).toBe(400);
    expect((err as ApiError).message).toMatch(/payments cover/);
  });
});

describe("payment allocation invariants", () => {
  it("rejects over-allocation beyond the outstanding balance", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const { invoice } = await draftInvoice(t);
    await finance.transitionInvoice(invoice.id, "ISSUED", t.ctx);
    const err = await finance
      .recordPayment({ invoiceId: invoice.id, direction: "INBOUND", amount: "99999.00", method: "BANK" }, t.ctx)
      .then(() => null, (e) => e);
    expect((err as ApiError).status).toBe(400);
    expect((err as ApiError).message).toMatch(/exceeds outstanding/);
    // No partial side effects: payment count must be zero (transaction rolled back).
    expect(await prisma.payment.count({ where: { tenantId: t.tenantId } })).toBe(0);
    const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(inv.amountPaid.toNumber()).toBe(0);
  });

  it("rejects payments against DRAFT or VOID invoices", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const { invoice } = await draftInvoice(t);
    const draftErr = await finance
      .recordPayment({ invoiceId: invoice.id, direction: "INBOUND", amount: "10", method: "CASH" }, t.ctx)
      .then(() => null, (e) => e);
    expect((draftErr as ApiError).message).toMatch(/draft/);
    await finance.transitionInvoice(invoice.id, "ISSUED", t.ctx);
    await finance.voidInvoice(invoice.id, "test void", t.ctx);
    const voidErr = await finance
      .recordPayment({ invoiceId: invoice.id, direction: "INBOUND", amount: "10", method: "CASH" }, t.ctx)
      .then(() => null, (e) => e);
    expect((voidErr as ApiError).message).toMatch(/void/);
  });

  it("direction must match invoice type (INBOUND only settles SALES)", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const { invoice } = await draftInvoice(t); // SALES by default
    await finance.transitionInvoice(invoice.id, "ISSUED", t.ctx);
    const err = await finance
      .recordPayment({ invoiceId: invoice.id, direction: "OUTBOUND", amount: "10", method: "BANK" }, t.ctx)
      .then(() => null, (e) => e);
    expect((err as ApiError).message).toMatch(/Inbound payments can only settle SALES|Outbound/);
  });

  it("fully paid invoice cannot accept further payments", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const { invoice } = await draftInvoice(t);
    await finance.transitionInvoice(invoice.id, "ISSUED", t.ctx);
    const total = (await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } })).total.toString();
    await finance.recordPayment({ invoiceId: invoice.id, direction: "INBOUND", amount: total, method: "BANK" }, t.ctx);
    const err = await finance
      .recordPayment({ invoiceId: invoice.id, direction: "INBOUND", amount: "1", method: "BANK" }, t.ctx)
      .then(() => null, (e) => e);
    expect((err as ApiError).status).toBe(409);
  });
});

describe("receivables reconciliation", () => {
  it("getReceivables agrees with authoritative invoice records", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const { invoice } = await draftInvoice(t);
    await finance.transitionInvoice(invoice.id, "ISSUED", t.ctx);
    await finance.recordPayment(
      { invoiceId: invoice.id, direction: "INBOUND", amount: "500.00", method: "BANK" },
      t.ctx,
    );
    const rec = await finance.getReceivables(t.ctx);
    const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    const expectedOutstanding = inv.total.sub(inv.amountPaid).toFixed(2);
    expect(rec.rows[0].outstanding).toBe(expectedOutstanding);
    expect(rec.totalOutstanding).toBe(expectedOutstanding);
    // Draft invoices must not appear in receivables.
    await draftInvoice(t);
    const rec2 = await finance.getReceivables(t.ctx);
    expect(rec2.rows.length).toBe(1);
  });

  it("audit trail records every consequential finance action", async () => {
    const t = await makeTenantWithUser("ADMIN");
    const { invoice } = await draftInvoice(t);
    await finance.transitionInvoice(invoice.id, "ISSUED", t.ctx);
    const actions = await prisma.auditLog.findMany({
      where: { tenantId: t.tenantId },
      select: { action: true },
    });
    const set = actions.map((a) => a.action);
    expect(set).toContain("finance.invoice.create");
    expect(set).toContain("finance.invoice.status_change");
  });
});
