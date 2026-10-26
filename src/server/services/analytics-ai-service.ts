import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "@/server/services/audit-service";
import type { TenantContext } from "@/lib/auth/session";
import { Prisma, type InsightStatus } from "@prisma/client";
import { createCampaignSchema, reviewInsightSchema, updateKpiSchema } from "@/lib/validation/schemas";

// ---------------------------------------------------------------------------
// Marketing campaigns & lead attribution
// ---------------------------------------------------------------------------

export async function createCampaign(input: unknown, ctx: TenantContext) {
  const data = createCampaignSchema.parse(input);
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    throw ApiError.validation("Campaign end date must be on or after start date");
  }
  const campaign = await prisma.campaign.create({
    data: {
      tenantId: ctx.tenantId,
      name: data.name,
      channel: data.channel,
      budget: data.budget !== undefined ? new Prisma.Decimal(data.budget) : undefined,
      startDate: data.startDate,
      endDate: data.endDate,
      notes: data.notes,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "marketing.campaign.create",
    entityType: "Campaign",
    entityId: campaign.id,
    summary: `Campaign '${campaign.name}' created`,
  });
  return campaign;
}

/**
 * Attribution counter used when a lead sourced by a campaign converts.
 * Counters only reflect events the system actually observed — never invented.
 */
export async function recordCampaignLead(campaignId: string, ctx: TenantContext) {
  const updated = await prisma.campaign.updateMany({
    where: { id: campaignId, tenantId: ctx.tenantId },
    data: { leadsCount: { increment: 1 } },
  });
  if (updated.count === 0) throw ApiError.notFound("Campaign not found");
  return updated;
}

// ---------------------------------------------------------------------------
// KPIs — definitions with targets; current values come from real aggregates.
// ---------------------------------------------------------------------------

export async function upsertKpi(key: string, input: unknown, ctx: TenantContext) {
  const data = updateKpiSchema.parse(input);
  const kpi = await prisma.kpi.upsert({
    where: { tenantId_key: { tenantId: ctx.tenantId, key } },
    create: {
      tenantId: ctx.tenantId,
      key,
      name: key,
      module: "general",
      targetValue: data.targetValue !== undefined ? new Prisma.Decimal(data.targetValue) : undefined,
      currentValue: data.currentValue !== undefined ? new Prisma.Decimal(data.currentValue) : undefined,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    },
    update: {
      ...(data.targetValue !== undefined ? { targetValue: new Prisma.Decimal(data.targetValue) } : {}),
      ...(data.currentValue !== undefined ? { currentValue: new Prisma.Decimal(data.currentValue) } : {}),
      ...(data.periodStart ? { periodStart: data.periodStart } : {}),
      ...(data.periodEnd ? { periodEnd: data.periodEnd } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "analytics.kpi.update",
    entityType: "Kpi",
    entityId: kpi.id,
    summary: `KPI '${key}' updated`,
  });
  return kpi;
}

/**
 * Pipeline summary computed from real opportunity rows (Decimal math).
 * No fabricated metrics: everything derives from stored records.
 */
export async function getSalesSummary(ctx: TenantContext) {
  const opps = await prisma.opportunity.findMany({
    where: { tenantId: ctx.tenantId },
    select: { stage: true, amount: true, probability: true },
  });
  let openValue = new Prisma.Decimal(0);
  let weightedValue = new Prisma.Decimal(0);
  let wonValue = new Prisma.Decimal(0);
  let openCount = 0;
  let wonCount = 0;
  let lostCount = 0;
  for (const o of opps) {
    const amt = o.amount ?? new Prisma.Decimal(0);
    if (o.stage === "CLOSED_WON") {
      wonValue = wonValue.add(amt);
      wonCount += 1;
    } else if (o.stage === "CLOSED_LOST") {
      lostCount += 1;
    } else {
      openValue = openValue.add(amt);
      weightedValue = weightedValue.add(amt.mul(new Prisma.Decimal(o.probability)).div(100));
      openCount += 1;
    }
  }
  const closed = wonCount + lostCount;
  return {
    openCount,
    openValue: openValue.toFixed(2),
    weightedPipelineValue: weightedValue.toFixed(2),
    wonValue: wonValue.toFixed(2),
    winRate: closed === 0 ? null : Number(((wonCount / closed) * 100).toFixed(1)),
  };
}

/** Receivables aging derived from invoice due dates and outstanding balances. */
export async function getReceivablesAging(ctx: TenantContext) {
  const invoices = await prisma.invoice.findMany({
    where: { tenantId: ctx.tenantId, type: "SALES", status: { in: ["ISSUED", "PARTIALLY_PAID"] } },
    select: { total: true, amountPaid: true, dueDate: true },
  });
  const now = Date.now();
  const buckets = { current: new Prisma.Decimal(0), d30: new Prisma.Decimal(0), d60: new Prisma.Decimal(0), over60: new Prisma.Decimal(0) };
  for (const i of invoices) {
    const outstanding = i.total.sub(i.amountPaid);
    const daysOverdue = i.dueDate ? Math.floor((now - i.dueDate.getTime()) / 86_400_000) : 0;
    if (daysOverdue <= 0) buckets.current = buckets.current.add(outstanding);
    else if (daysOverdue <= 30) buckets.d30 = buckets.d30.add(outstanding);
    else if (daysOverdue <= 60) buckets.d60 = buckets.d60.add(outstanding);
    else buckets.over60 = buckets.over60.add(outstanding);
  }
  return {
    current: buckets.current.toFixed(2),
    overdue1to30: buckets.d30.toFixed(2),
    overdue31to60: buckets.d60.toFixed(2),
    overdueOver60: buckets.over60.toFixed(2),
  };
}

// ---------------------------------------------------------------------------
// AI insights — records grounded in evidence references; no fabricated predictions.
// ---------------------------------------------------------------------------

/**
 * Create an insight record whose evidence MUST reference existing tenant
 * entity ids (validated at creation). Confidence/model metadata are optional
 * and only set when produced by a real model or rule engine.
 */
export async function createInsight(
  args: {
    kind: "INSIGHT" | "RECOMMENDATION" | "PREDICTION";
    module: string;
    title: string;
    summary: string;
    evidence: Array<{ entityType: string; entityId: string }>;
    confidence?: number;
    modelName?: string;
    modelVersion?: string;
  },
  ctx: TenantContext,
) {
  if (!args.evidence || args.evidence.length === 0) {
    throw ApiError.validation("AI insights require at least one evidence reference");
  }
  // Provenance invariant: every evidence ref must point to a real record in this tenant.
  for (const ev of args.evidence) {
    const table = MODEL_TABLES[ev.entityType];
    if (!table) throw ApiError.validation(`Unknown evidence entityType '${ev.entityType}'`);
    const found = await (prisma as unknown as Record<string, { findFirst(a: unknown): Promise<unknown> }>)[table]!.findFirst({
      where: { id: ev.entityId, tenantId: ctx.tenantId },
    });
    if (!found) throw ApiError.validation(`Evidence reference ${ev.entityType}/${ev.entityId} does not exist in this organization`);
  }
  if (args.confidence !== undefined && (args.confidence < 0 || args.confidence > 1)) {
    throw ApiError.validation("confidence must be between 0 and 1");
  }
  const insight = await prisma.aiInsight.create({
    data: {
      tenantId: ctx.tenantId,
      kind: args.kind,
      module: args.module,
      title: args.title,
      summary: args.summary,
      evidence: args.evidence as unknown as Prisma.InputJsonValue,
      confidence: args.confidence,
      modelName: args.modelName,
      modelVersion: args.modelVersion,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "ai.insight.create",
    entityType: "AiInsight",
    entityId: insight.id,
    summary: `${insight.kind} recorded for module ${insight.module}`,
  });
  return insight;
}

const MODEL_TABLES: Record<string, string> = {
  Lead: "lead",
  Company: "company",
  Contact: "contact",
  Opportunity: "opportunity",
  Quotation: "quotation",
  SalesOrder: "salesOrder",
  Invoice: "invoice",
  Payment: "payment",
  Expense: "expense",
  Product: "product",
  StockMovement: "stockMovement",
  PurchaseOrder: "purchaseOrder",
  Project: "project",
  Task: "task",
  Campaign: "campaign",
  Kpi: "kpi",
};

const INSIGHT_EDGES: Record<InsightStatus, readonly InsightStatus[]> = {
  GENERATED: ["UNDER_REVIEW", "APPROVED", "DISMISSED"],
  UNDER_REVIEW: ["APPROVED", "DISMISSED"],
  APPROVED: ["ACTED_UPON"],
  DISMISSED: [],
  ACTED_UPON: [],
};

export async function reviewInsight(insightId: string, input: unknown, ctx: TenantContext) {
  const data = reviewInsightSchema.parse(input);
  const insight = await prisma.aiInsight.findFirst({ where: { id: insightId, tenantId: ctx.tenantId } });
  if (!insight) throw ApiError.notFound("Insight not found");
  if (!INSIGHT_EDGES[insight.status].includes(data.decision)) {
    throw ApiError.validation(`Illegal insight review transition: ${insight.status} -> ${data.decision}`);
  }
  const updated = await prisma.aiInsight.update({
    where: { id: insight.id },
    data: {
      status: data.decision,
      reviewedByUserId: ctx.user.id,
      reviewedAt: new Date(),
      reviewNote: data.note,
      actedAt: data.decision === "ACTED_UPON" ? new Date() : insight.actedAt,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "ai.insight.review",
    entityType: "AiInsight",
    entityId: insight.id,
    summary: `Insight '${insight.title}' ${data.decision}`,
  });
  return updated;
}
