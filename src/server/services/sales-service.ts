import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "@/server/services/audit-service";
import { nextNumber } from "@/server/services/numbering";
import { permissionsForRole } from "@/lib/permissions/rbac";
import type { TenantContext } from "@/lib/auth/session";
import { Prisma, type DocumentStatus, type OpportunityStage } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { publish } from "@/server/events/event-bus";
import { recordHandover, isHandoverProcessed } from "@/server/workflows/handover-service";
import {
  createOpportunitySchema,
  createQuotationSchema,
  createSalesOrderSchema,
  isLegalStageTransition,
  moveOpportunityStageSchema,
  paginationQuerySchema,
} from "@/lib/validation/schemas";

const STAGE_PROBABILITY: Record<OpportunityStage, number> = {
  IDENTIFICATION: 10,
  QUALIFICATION: 25,
  PROPOSAL: 50,
  NEGOTIATION: 75,
  CLOSED_WON: 100,
  CLOSED_LOST: 0,
};

// ---------------------------------------------------------------------------
// Pipelines
// ---------------------------------------------------------------------------

export async function listPipelines(ctx: TenantContext) {
  return prisma.pipeline.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { createdAt: "asc" },
  });
}

// ---------------------------------------------------------------------------
// Opportunities
// ---------------------------------------------------------------------------

export async function createOpportunity(input: unknown, ctx: TenantContext) {
  const data = createOpportunitySchema.parse(input);
  if (data.pipelineId) {
    const p = await prisma.pipeline.findFirst({
      where: { id: data.pipelineId, tenantId: ctx.tenantId },
    });
    if (!p) throw ApiError.validation("pipelineId does not belong to this organization");
  }
  if (data.leadId) {
    const lead = await prisma.lead.findFirst({ where: { id: data.leadId, tenantId: ctx.tenantId } });
    if (!lead) throw ApiError.validation("leadId does not belong to this organization");
    const existing = await prisma.opportunity.findFirst({ where: { leadId: lead.id } });
    if (existing) throw ApiError.conflict("An opportunity already exists for this lead");
  }
  if (data.companyId) {
    const c = await prisma.company.findFirst({ where: { id: data.companyId, tenantId: ctx.tenantId } });
    if (!c) throw ApiError.validation("companyId does not belong to this organization");
  }
  const ownerId = data.ownerId ?? ctx.user.id;
  if (data.ownerId) {
    const m = await prisma.membership.findFirst({
      where: { userId: data.ownerId, tenantId: ctx.tenantId, isActive: true },
    });
    if (!m) throw ApiError.validation("ownerId is not an active member of this organization");
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      tenantId: ctx.tenantId,
      name: data.name,
      pipelineId: data.pipelineId,
      amount: data.amount !== undefined ? new Prisma.Decimal(data.amount) : undefined,
      currency: data.currency,
      expectedCloseDate: data.expectedCloseDate,
      leadId: data.leadId,
      companyId: data.companyId,
      ownerId,
      probability: STAGE_PROBABILITY.IDENTIFICATION,
    },
  });

  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "sales.opportunity.create",
    entityType: "Opportunity",
    entityId: opportunity.id,
    summary: `Opportunity '${opportunity.name}' created`,
  });
  return opportunity;
}

export async function listOpportunities(query: unknown, ctx: TenantContext) {
  const q = paginationQuerySchema.parse(query);
  const where: Prisma.OpportunityWhereInput = { tenantId: ctx.tenantId };
  const [items, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.opportunity.count({ where }),
  ]);
  return { items, total, page: q.page, pageSize: q.pageSize };
}

export async function moveOpportunityStage(
  opportunityId: string,
  input: unknown,
  ctx: TenantContext,
) {
  const data = moveOpportunityStageSchema.parse(input);
  const opp = await prisma.opportunity.findFirst({
    where: { id: opportunityId, tenantId: ctx.tenantId },
  });
  if (!opp) throw ApiError.notFound("Opportunity not found");
  if (!isLegalStageTransition(opp.stage, data.stage)) {
    throw ApiError.validation(`Illegal stage transition: ${opp.stage} -> ${data.stage}`);
  }
  // Re-opening a lost deal requires manager+ (crm.delete is the manager-level
  // permission marker). Resolve permissions from the CURRENT membership row at
  // request time — never from a cached/context snapshot — so a role change or
  // revocation takes effect immediately even if the session predates it.
  if (opp.stage === "CLOSED_LOST" && data.stage !== "CLOSED_LOST") {
    const current = await prisma.membership.findFirst({
      where: { userId: ctx.user.id, tenantId: ctx.tenantId, isActive: true },
      select: { role: true },
    });
    if (!current || !permissionsForRole(current.role).has("crm.delete")) {
      throw ApiError.forbidden("Only managers can re-open a lost opportunity");
    }
  }
  if (data.stage === "CLOSED_LOST" && !data.lostReason) {
    throw ApiError.validation("lostReason is required when closing as lost");
  }
  const updated = await prisma.opportunity.update({
    where: { id: opp.id },
    data: {
      stage: data.stage,
      probability: STAGE_PROBABILITY[data.stage],
      lostReason: data.stage === "CLOSED_LOST" ? data.lostReason : null,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "sales.opportunity.stage_change",
    entityType: "Opportunity",
    entityId: opp.id,
    summary: `Opportunity '${opp.name}' moved ${opp.stage} -> ${data.stage}`,
  });
  await publish({
    name: "opportunity.stage_changed",
    tenantId: ctx.tenantId,
    actorUserId: ctx.user.id,
    membershipId: ctx.membershipId,
    eventId: `opportunity.stage:${opp.id}:${randomUUID()}`,
    opportunityId: opp.id,
    from: opp.stage,
    to: data.stage,
  });
  // Marketing attribution: only when the deal traces to a lead with a source —
  // never inferred. Revenue is recorded against the linked lead's campaign note.
  if (data.stage === "CLOSED_WON" && opp.leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: opp.leadId }, select: { id: true } });
    if (lead) {
      const attr = await prisma.activity.findFirst({
        where: { leadId: lead.id, subject: { startsWith: "Attributed to campaign " } },
      });
      if (attr) {
        const campaignId = attr.subject.replace("Attributed to campaign ", "");
        const camp = await prisma.campaign.findFirst({ where: { id: campaignId, tenantId: ctx.tenantId } });
        if (camp) {
          await prisma.campaign.update({
            where: { id: camp.id },
            data: {
              conversions: { increment: 1 },
              revenue: (camp.revenue ?? new Prisma.Decimal(0)).add(opp.amount ?? 0),
            },
          });
        }
      }
    }
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Quotations — issued versions are immutable once SENT or later.
// ---------------------------------------------------------------------------

interface QuotationLine {
  description: string;
  quantity: number;
  unitPrice: string;
}

function computeLinesTotal(lines: QuotationLine[]): Prisma.Decimal {
  return lines.reduce(
    (sum, l) => sum.add(new Prisma.Decimal(l.unitPrice).mul(new Prisma.Decimal(l.quantity))),
    new Prisma.Decimal(0),
  );
}

export async function createQuotation(input: unknown, ctx: TenantContext) {
  const data = createQuotationSchema.parse(input);
  const opp = await prisma.opportunity.findFirst({
    where: { id: data.opportunityId, tenantId: ctx.tenantId },
  });
  if (!opp) throw ApiError.notFound("Opportunity not found");

  const normalizedLines: QuotationLine[] = data.lines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPrice: new Prisma.Decimal(l.unitPrice).toFixed(2),
  }));
  const total = computeLinesTotal(normalizedLines);

  const quotation = await prisma.$transaction(async (tx) => {
    const number = await nextNumber(tx, ctx.tenantId, "QUO");
    return tx.quotation.create({
      data: {
        tenantId: ctx.tenantId,
        opportunityId: opp.id,
        number,
        lines: normalizedLines as unknown as Prisma.InputJsonValue,
        total,
        validUntil: data.validUntil,
      },
    });
  });

  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "sales.quotation.create",
    entityType: "Quotation",
    entityId: quotation.id,
    summary: `Quotation ${quotation.number} created (${total.toFixed(2)})`,
  });
  return quotation;
}

/** Advance quotation status. Issued versions cannot be edited, only transitioned. */
export async function setQuotationStatus(
  quotationId: string,
  status: DocumentStatus,
  ctx: TenantContext,
) {
  const quo = await prisma.quotation.findFirst({
    where: { id: quotationId, tenantId: ctx.tenantId },
  });
  if (!quo) throw ApiError.notFound("Quotation not found");
  const allowed: Record<DocumentStatus, DocumentStatus[]> = {
    DRAFT: ["SENT", "REJECTED"],
    SENT: ["ACCEPTED", "REJECTED", "EXPIRED"],
    ACCEPTED: [],
    REJECTED: [],
    EXPIRED: [],
  };
  if (!allowed[quo.status].includes(status)) {
    throw ApiError.validation(`Illegal quotation transition: ${quo.status} -> ${status}`);
  }
  const updated = await prisma.quotation.update({ where: { id: quo.id }, data: { status } });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "sales.quotation.status_change",
    entityType: "Quotation",
    entityId: quo.id,
    summary: `Quotation ${quo.number}: ${quo.status} -> ${status}`,
  });
  return updated;
}

// ---------------------------------------------------------------------------
// Sales orders — confirming an order on stock-tracked goods creates a draft
// invoice; fulfillment reserves nothing but decrements stock transactionally.
// ---------------------------------------------------------------------------

interface OrderLine {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: string;
}

export async function createSalesOrder(input: unknown, ctx: TenantContext) {
  const data = createSalesOrderSchema.parse(input);

  // Validate cross-references belong to tenant.
  if (data.opportunityId) {
    const o = await prisma.opportunity.findFirst({
      where: { id: data.opportunityId, tenantId: ctx.tenantId },
    });
    if (!o) throw ApiError.validation("opportunityId does not belong to this organization");
  }
  if (data.companyId) {
    const c = await prisma.company.findFirst({
      where: { id: data.companyId, tenantId: ctx.tenantId },
    });
    if (!c) throw ApiError.validation("companyId does not belong to this organization");
  }
  if (data.warehouseId) {
    const w = await prisma.warehouse.findFirst({
      where: { id: data.warehouseId, tenantId: ctx.tenantId },
    });
    if (!w) throw ApiError.validation("warehouseId does not belong to this organization");
  }
  for (const line of data.lines) {
    if (line.productId) {
      const p = await prisma.product.findFirst({
        where: { id: line.productId, tenantId: ctx.tenantId },
      });
      if (!p) throw ApiError.validation(`Product ${line.productId} not found in this organization`);
    }
  }

  const normalizedLines: OrderLine[] = data.lines.map((l) => ({
    productId: l.productId,
    description: l.description,
    quantity: l.quantity,
    unitPrice: new Prisma.Decimal(l.unitPrice).toFixed(2),
  }));
  const total = normalizedLines.reduce(
    (s, l) => s.add(new Prisma.Decimal(l.unitPrice).mul(new Prisma.Decimal(l.quantity))),
    new Prisma.Decimal(0),
  );

  const order = await prisma.$transaction(async (tx) => {
    const number = await nextNumber(tx, ctx.tenantId, "SO");
    return tx.salesOrder.create({
      data: {
        tenantId: ctx.tenantId,
        number,
        opportunityId: data.opportunityId,
        companyId: data.companyId,
        warehouseId: data.warehouseId,
        lines: normalizedLines as unknown as Prisma.InputJsonValue,
        total,
      },
    });
  });

  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "sales.order.create",
    entityType: "SalesOrder",
    entityId: order.id,
    summary: `Sales order ${order.number} created (${total.toFixed(2)})`,
  });
  return order;
}

/**
 * Confirm -> issue a sales invoice automatically (single transaction so an
 * order never exists confirmed without its invoice).
 */
export async function confirmSalesOrder(orderId: string, ctx: TenantContext) {
  const order = await prisma.salesOrder.findFirst({
    where: { id: orderId, tenantId: ctx.tenantId },
  });
  if (!order) throw ApiError.notFound("Sales order not found");
  if (order.status !== "DRAFT") throw ApiError.validation(`Order is ${order.status}, only DRAFT can be confirmed`);

  const result = await prisma.$transaction(async (tx) => {
    const invNumber = await nextNumber(tx, ctx.tenantId, "INV");
    const invoice = await tx.invoice.create({
      data: {
        tenantId: ctx.tenantId,
        number: invNumber,
        type: "SALES",
        status: "ISSUED",
        companyId: order.companyId,
        salesOrderId: order.id,
        subtotal: order.total,
        taxAmount: new Prisma.Decimal(0),
        total: order.total,
      },
    });
    const updatedOrder = await tx.salesOrder.update({
      where: { id: order.id },
      data: { status: "CONFIRMED" },
    });
    return { order: updatedOrder, invoice };
  });

  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "sales.order.confirm",
    entityType: "SalesOrder",
    entityId: order.id,
    summary: `Sales order ${order.number} confirmed; invoice ${result.invoice.number} issued`,
  });
  // Sale-to-delivery handover ledger — unique per (kind, order): retries cannot
  // create duplicate deliveries/projects/invoices.
  await recordHandover(ctx, {
    kind: "ORDER_INVOICE",
    sourceType: "SalesOrder",
    sourceId: order.id,
    targetId: result.invoice.id,
    idempotencyKey: `order-invoice:${order.id}`,
  });
  await publish({
    name: "order.confirmed",
    tenantId: ctx.tenantId,
    actorUserId: ctx.user.id,
    membershipId: ctx.membershipId,
    eventId: `order.confirmed:${order.id}`,
    orderId: order.id,
    orderNumber: order.number,
    total: order.total,
  });
  return result;
}

/**
 * Fulfill a confirmed order: decrement stock atomically for GOODS lines that
 * have a productId and require stock at the order's warehouse. Negative stock
 * is rejected — inventory consistency is preserved.
 */
export async function fulfillSalesOrder(orderId: string, ctx: TenantContext) {
  const order = await prisma.salesOrder.findFirst({
    where: { id: orderId, tenantId: ctx.tenantId },
  });
  if (!order) throw ApiError.notFound("Sales order not found");
  if (order.status !== "CONFIRMED") throw ApiError.validation(`Order is ${order.status}, only CONFIRMED can be fulfilled`);

  const lines = order.lines as unknown as OrderLine[];
  const stockLines = lines.filter((l) => l.productId);

  // Idempotency guard: if this order was already handed over to delivery,
  // a retried fulfillment must not decrement stock or record movements twice.
  const handoverKey = `order-fulfillment:${order.id}`;
  if (await isHandoverProcessed(handoverKey)) {
    throw ApiError.conflict(`Sales order ${order.number} has already been fulfilled`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Re-check status under the row lock so two concurrent fulfillments
    // cannot both pass the CONFIRMED check and double-deduct stock.
    const locked = await tx.$queryRaw<Array<{ status: string }>>`
      SELECT status FROM "sales_orders" WHERE id = ${order.id} FOR UPDATE`;
    if (locked[0]?.status !== "CONFIRMED") {
      throw ApiError.conflict("Order status changed concurrently; reload and retry");
    }
    for (const line of stockLines) {
      const product = await tx.product.findFirst({
        where: { id: line.productId!, tenantId: ctx.tenantId },
      });
      if (!product || product.type !== "GOODS") continue;
      const warehouseId = order.warehouseId;
      if (!warehouseId) {
        throw ApiError.validation(`Order has no warehouse; cannot deduct stock for '${line.description}'`);
      }
      // Lock-then-update on the stock row: concurrent withdrawals from the
      // same SKU/warehouse are serialized, so balances stay consistent.
      const stockRows = await tx.$queryRaw<Array<{ id: string; quantity: Prisma.Decimal }>>`
        SELECT id, quantity FROM "stock_items"
        WHERE "productId" = ${line.productId!} AND "warehouseId" = ${warehouseId} FOR UPDATE`;
      const stockItem = stockRows[0];
      const available = stockItem?.quantity ?? new Prisma.Decimal(0);
      const requested = new Prisma.Decimal(line.quantity);
      if (!stockItem || available.lt(requested)) {
        throw ApiError.conflict(
          `Insufficient stock for SKU ${product.sku}: available ${available.toString()}, requested ${requested.toString()}`,
        );
      }
      await tx.stockItem.update({
        where: { id: stockItem.id },
        data: { quantity: { decrement: requested } },
      });
      await tx.stockMovement.create({
        data: {
          tenantId: ctx.tenantId,
          productId: line.productId!,
          warehouseId,
          type: "SALE",
          quantity: requested.neg(),
          reference: order.number,
          reason: `Fulfillment of sales order ${order.number}`,
        },
      });
    }
    return tx.salesOrder.update({ where: { id: order.id }, data: { status: "FULFILLED" } });
  });

  // Record the delivery handover after commit; unique key makes retries safe.
  await recordHandover(ctx, {
    kind: "ORDER_DELIVERY",
    sourceType: "SalesOrder",
    sourceId: order.id,
    targetId: order.id,
    idempotencyKey: handoverKey,
  });

  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "sales.order.fulfill",
    entityType: "SalesOrder",
    entityId: order.id,
    summary: `Sales order ${order.number} fulfilled; stock movements recorded`,
  });
  return updated;
}

export async function cancelSalesOrder(orderId: string, ctx: TenantContext) {
  const order = await prisma.salesOrder.findFirst({
    where: { id: orderId, tenantId: ctx.tenantId },
  });
  if (!order) throw ApiError.notFound("Sales order not found");
  if (order.status === "FULFILLED") throw ApiError.validation("Fulfilled orders cannot be cancelled");
  if (order.status === "CANCELLED") throw ApiError.conflict("Order is already cancelled");
  const updated = await prisma.salesOrder.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "sales.order.cancel",
    entityType: "SalesOrder",
    entityId: order.id,
    summary: `Sales order ${order.number} cancelled`,
  });
  return updated;
}
