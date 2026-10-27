import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "@/server/services/audit-service";
import { nextNumber } from "@/server/services/numbering";
import type { TenantContext } from "@/lib/auth/session";
import { Prisma, type InvoiceStatus } from "@prisma/client";
import {
  createExpenseSchema,
  createInvoiceSchema,
  recordPaymentSchema,
} from "@/lib/validation/schemas";

// All money math uses Prisma.Decimal (Postgres NUMERIC(14,2)) — never floats.

interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPrice: string;
  taxRate?: number;
}

interface InvoiceLine extends InvoiceLineInput {
  lineTotal: string; // quantity * unitPrice
  lineTax: string; // round2(lineTotal * taxRate%)
}

function round2(d: Prisma.Decimal): Prisma.Decimal {
  return d.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

function computeInvoiceTotals(lines: InvoiceLine[]): { subtotal: Prisma.Decimal; taxAmount: Prisma.Decimal; total: Prisma.Decimal } {
  let subtotal = new Prisma.Decimal(0);
  let taxAmount = new Prisma.Decimal(0);
  for (const l of lines) {
    subtotal = subtotal.add(new Prisma.Decimal(l.lineTotal));
    taxAmount = taxAmount.add(new Prisma.Decimal(l.lineTax));
  }
  return { subtotal: round2(subtotal), taxAmount: round2(taxAmount), total: round2(subtotal.add(taxAmount)) };
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export async function createInvoice(input: unknown, ctx: TenantContext) {
  const data = createInvoiceSchema.parse(input);
  if (data.companyId) {
    const c = await prisma.company.findFirst({ where: { id: data.companyId, tenantId: ctx.tenantId } });
    if (!c) throw ApiError.validation("companyId does not belong to this organization");
  } else if (data.type === "SALES") {
    throw ApiError.validation("Sales invoices require a company");
  }
  if (data.salesOrderId) {
    const so = await prisma.salesOrder.findFirst({
      where: { id: data.salesOrderId, tenantId: ctx.tenantId },
    });
    if (!so) throw ApiError.validation("salesOrderId does not belong to this organization");
    const existing = await prisma.invoice.findFirst({ where: { salesOrderId: so.id } });
    if (existing) throw ApiError.conflict("An invoice already exists for this sales order");
  }

  const lines: InvoiceLine[] = data.lines.map((l) => {
    const lineTotal = round2(new Prisma.Decimal(l.unitPrice).mul(new Prisma.Decimal(l.quantity)));
    const rate = l.taxRate ?? 0;
    const lineTax = round2(lineTotal.mul(new Prisma.Decimal(rate).div(100)));
    return { description: l.description, quantity: l.quantity, unitPrice: new Prisma.Decimal(l.unitPrice).toFixed(2), taxRate: l.taxRate, lineTotal: lineTotal.toFixed(2), lineTax: lineTax.toFixed(2) };
  });
  const totals = computeInvoiceTotals(lines);
  // Business invariant: invoice total must reconcile with its line items.
  const recomputed = computeInvoiceTotals(lines);
  if (!recomputed.total.equals(totals.total)) {
    throw ApiError.validation("Invoice totals failed reconciliation check");
  }

  const invoice = await prisma.$transaction(async (tx) => {
    const number = await nextNumber(tx, ctx.tenantId, data.type === "SALES" ? "INV" : "PIN");
    return tx.invoice.create({
      data: {
        tenantId: ctx.tenantId,
        number,
        type: data.type,
        status: "DRAFT",
        companyId: data.companyId,
        salesOrderId: data.salesOrderId,
        issueDate: data.issueDate ?? new Date(),
        dueDate: data.dueDate,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        notes: data.notes,
      },
    });
  });

  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "finance.invoice.create",
    entityType: "Invoice",
    entityId: invoice.id,
    summary: `${data.type} invoice ${invoice.number} drafted (${totals.total.toFixed(2)})`,
  });
  return { invoice, lines };
}

const INVOICE_EDGES: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  DRAFT: ["ISSUED", "VOID"],
  ISSUED: ["PARTIALLY_PAID", "PAID", "VOID"],
  PARTIALLY_PAID: ["PAID", "VOID"],
  PAID: [],
  VOID: [],
};

export async function transitionInvoice(invoiceId: string, to: InvoiceStatus, ctx: TenantContext) {
  // Lock the invoice row for the whole check-and-update so concurrent
  // transitions (or a concurrent payment allocation) cannot interleave and
  // produce an inconsistent status. This schema uses Prisma's default column
  // naming (camelCase identifiers quoted in DDL), so the raw row keeps the
  // model's camelCase field names — verified against the live test database.
  interface InvoiceLockRow {
    id: string;
    number: string;
    status: InvoiceStatus;
    total: Prisma.Decimal;
    amountPaid: Prisma.Decimal;
  }
  // Captured inside the transaction so the audit summary can reference the
  // pre-transition state read under the row lock.
  let auditSummary = "";
  const updated = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<InvoiceLockRow[]>`
      SELECT id, number, status, total, "amountPaid" FROM "invoices"
      WHERE id = ${invoiceId} AND "tenantId" = ${ctx.tenantId} FOR UPDATE`;
    const inv = rows[0];
    if (!inv) throw ApiError.notFound("Invoice not found");
    if (!INVOICE_EDGES[inv.status].includes(to)) {
      throw ApiError.validation(`Illegal invoice transition: ${inv.status} -> ${to}`);
    }
    if (to === "PAID" && !inv.amountPaid.equals(inv.total)) {
      throw ApiError.validation("Cannot mark invoice PAID before payments cover the full total");
    }
    if (to === "VOID" && inv.amountPaid.gt(0)) {
      // A voided invoice must not retain settled money — otherwise receivables
      // reporting would silently drop paid amounts. Callers must refund or
      // reallocate payments first.
      throw ApiError.conflict(
        `Invoice has ${inv.amountPaid.toFixed(2)} allocated in payments; refund or reallocate them before voiding`,
      );
    }
    // Audit summary is built inside the transaction where the locked row data
    // is in scope; the write itself happens after commit (append-only trail).
    auditSummary = `Invoice ${inv.number}: ${inv.status} -> ${to}`;
    return tx.invoice.update({ where: { id: inv.id }, data: { status: to } });
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "finance.invoice.status_change",
    entityType: "Invoice",
    entityId: invoiceId,
    summary: auditSummary,
  });
  return updated;
}

/** Void is the only correction path for issued invoices — records are never erased. */
export async function voidInvoice(invoiceId: string, reason: string, ctx: TenantContext) {
  if (!reason?.trim()) throw ApiError.validation("A void reason is required");
  return transitionInvoice(invoiceId, "VOID", ctx);
}

// ---------------------------------------------------------------------------
// Payments — allocation can never exceed the outstanding amount.
// ---------------------------------------------------------------------------

export async function recordPayment(input: unknown, ctx: TenantContext) {
  const data = recordPaymentSchema.parse(input);
  const amount = round2(new Prisma.Decimal(data.amount));
  if (amount.lte(0)) throw ApiError.validation("Payment amount must be positive");

  const result = await prisma.$transaction(async (tx) => {
    const number = await nextNumber(tx, ctx.tenantId, data.direction === "INBOUND" ? "PMT" : "OUT");
    let invoice: Awaited<ReturnType<typeof tx.invoice.findFirst>> | null = null;

    if (data.invoiceId) {
      // Lock-then-check on the invoice row so two concurrent payment
      // allocations cannot both read the same outstanding balance and
      // over-settle it (lost-update). This mirrors the locking used by
      // transitionInvoice() and stock withdrawals in fulfillSalesOrder().
      const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "invoices" WHERE id = ${data.invoiceId} AND "tenantId" = ${ctx.tenantId} FOR UPDATE`;
      if (lockedRows.length === 0) throw ApiError.validation("invoiceId does not belong to this organization");
      invoice = await tx.invoice.findFirst({ where: { id: data.invoiceId, tenantId: ctx.tenantId } });
      if (!invoice) throw ApiError.validation("invoiceId does not belong to this organization");
      if (invoice.status === "DRAFT") throw ApiError.validation("Payments cannot be allocated to draft invoices");
      if (invoice.status === "VOID") throw ApiError.validation("Payments cannot be allocated to void invoices");
      if (invoice.status === "PAID") throw ApiError.conflict("Invoice is already fully paid");
      if (data.direction === "INBOUND" && invoice.type !== "SALES") {
        throw ApiError.validation("Inbound payments can only settle SALES invoices");
      }
      if (data.direction === "OUTBOUND" && invoice.type !== "PURCHASE") {
        throw ApiError.validation("Outbound payments can only settle PURCHASE invoices");
      }
      const outstanding = invoice.total.sub(invoice.amountPaid);
      if (amount.gt(outstanding)) {
        throw ApiError.validation(
          `Payment allocation exceeds outstanding balance: requested ${amount.toFixed(2)}, outstanding ${outstanding.toFixed(2)}`,
        );
      }
      const newPaid = invoice.amountPaid.add(amount);
      const newStatus: InvoiceStatus = newPaid.equals(invoice.total) ? "PAID" : "PARTIALLY_PAID";
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { amountPaid: newPaid, status: newStatus },
      });
    }

    const payment = await tx.payment.create({
      data: {
        tenantId: ctx.tenantId,
        number,
        invoiceId: invoice?.id ?? null,
        direction: data.direction,
        amount,
        method: data.method,
        paidAt: data.paidAt ?? new Date(),
        reference: data.reference,
        notes: data.notes,
      },
    });
    return { payment, invoice };
  });

  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "finance.payment.record",
    entityType: "Payment",
    entityId: result.payment.id,
    summary: `${data.direction} payment ${result.payment.number} of ${amount.toFixed(2)}${result.invoice ? ` applied to ${result.invoice.number}` : ""}`,
  });
  return result.payment;
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export async function createExpense(input: unknown, ctx: TenantContext) {
  const data = createExpenseSchema.parse(input);
  const amount = round2(new Prisma.Decimal(data.amount));
  const expense = await prisma.$transaction(async (tx) => {
    const number = await nextNumber(tx, ctx.tenantId, "EXP");
    return tx.expense.create({
      data: {
        tenantId: ctx.tenantId,
        number,
        category: data.category,
        amount,
        spentAt: data.spentAt ?? new Date(),
        vendor: data.vendor,
        description: data.description,
      },
    });
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "finance.expense.create",
    entityType: "Expense",
    entityId: expense.id,
    summary: `Expense ${expense.number} '${data.category}' recorded (${amount.toFixed(2)})`,
  });
  return expense;
}

// ---------------------------------------------------------------------------
// Receivables / payables summaries (derived, never invented)
// ---------------------------------------------------------------------------

export async function getReceivables(ctx: TenantContext) {
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: ctx.tenantId,
      type: "SALES",
      status: { in: ["ISSUED", "PARTIALLY_PAID"] },
    },
    include: { company: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
  });
  const rows = invoices.map((i) => ({
    invoiceId: i.id,
    number: i.number,
    company: i.company,
    total: i.total.toString(),
    amountPaid: i.amountPaid.toString(),
    outstanding: i.total.sub(i.amountPaid).toString(),
    dueDate: i.dueDate,
  }));
  const totalOutstanding = rows.reduce((s, r) => s.add(new Prisma.Decimal(r.outstanding)), new Prisma.Decimal(0));
  return { rows, totalOutstanding: totalOutstanding.toFixed(2) };
}

export async function getPayables(ctx: TenantContext) {
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: ctx.tenantId,
      type: "PURCHASE",
      status: { in: ["ISSUED", "PARTIALLY_PAID"] },
    },
    orderBy: { dueDate: "asc" },
  });
  const rows = invoices.map((i) => ({
    invoiceId: i.id,
    number: i.number,
    total: i.total.toString(),
    amountPaid: i.amountPaid.toString(),
    outstanding: i.total.sub(i.amountPaid).toString(),
    dueDate: i.dueDate,
  }));
  const totalOutstanding = rows.reduce((s, r) => s.add(new Prisma.Decimal(r.outstanding)), new Prisma.Decimal(0));
  return { rows, totalOutstanding: totalOutstanding.toFixed(2) };
}
