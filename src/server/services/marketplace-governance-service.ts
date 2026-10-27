import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "./audit-service";
import { assertPermission, isProcessingPermitted } from "./governance-service";
import type { TenantContext } from "@/lib/auth/session";
import type { ReviewStatus } from "@prisma/client";

/**
 * Stage 16 — Marketplace safeguards, AI data-use governance, export controls,
 * third-party sharing registry, and incident tracking.
 *
 * These are GOVERNANCE FOUNDATIONS ONLY: no dataset is released externally,
 * no buyer access exists, and every gate fails closed when a prerequisite is
 * missing or unverified.
 */

// ---------------------------------------------------------------------------
// AI/ML data-use approvals
// ---------------------------------------------------------------------------

export const AI_USE_TYPES = [
  "FEATURE_DELIVERY", // serving AI features to this tenant (contracted SaaS)
  "CONTEXT_RETRIEVAL", // RAG context for this tenant's own assistant
  "OUTPUT_EVALUATION", // evaluating AI outputs on tenant data
  "PROMPT_IMPROVEMENT", // improving prompts/business rules from tenant data
  "MODEL_TRAINING", // training/fine-tuning SHARED models
  "CROSS_TENANT_BENCHMARKING", // aggregating across tenants
  "COMMERCIAL_INTELLIGENCE", // producing external commercial datasets
] as const;
export type AiUseType = (typeof AI_USE_TYPES)[number];

/**
 * Authoritative check called by AI services BEFORE any secondary use of
 * tenant data. Ordinary SaaS delivery does not imply training/benchmarking
 * permission — those require an explicit APPROVED record.
 */
export async function assertAiDataUseAllowed(
  tenantId: string,
  useType: AiUseType,
): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  // Delivery/context uses are part of the contracted service but STILL must
  // be limited to the requesting tenant's own rows (enforced by callers via
  // tenant-scoped queries); they do not need a separate approval record.
  if (useType === "FEATURE_DELIVERY" || useType === "CONTEXT_RETRIEVAL") {
    return { allowed: true };
  }
  const approval = await prisma.aiDataUseApproval.findUnique({
    where: {
      tenantId_useType: { tenantId, useType },
    },
  });
  if (!approval || approval.status !== "APPROVED") {
    return { allowed: false, reason: `ai_data_use_not_approved:${useType}` };
  }
  return { allowed: true };
}

export async function requestAiDataUseApproval(
  ctx: TenantContext,
  input: { useType: AiUseType; dataCategoryIds: string[]; notes?: string },
) {
  assertPermission(ctx, "governance.policies.manage");
  if (!AI_USE_TYPES.includes(input.useType)) {
    throw ApiError.validation("Unknown AI data-use type");
  }
  // Every referenced category must belong to this tenant.
  const owned = await prisma.dataCategory.count({
    where: { id: { in: input.dataCategoryIds }, tenantId: ctx.tenantId },
  });
  if (owned !== input.dataCategoryIds.length) {
    throw ApiError.forbidden("One or more data categories are outside your organization");
  }
  const upserted = await prisma.aiDataUseApproval.upsert({
    where: { tenantId_useType: { tenantId: ctx.tenantId, useType: input.useType } },
    update: {
      dataCategoryIds: input.dataCategoryIds,
      status: "UNAPPROVED", // re-requesting always resets to pending
      notes: input.notes ?? null,
      decidedBy: null,
      decidedAt: null,
    },
    create: {
      tenantId: ctx.tenantId,
      useType: input.useType,
      dataCategoryIds: input.dataCategoryIds,
      requestedByMembershipId: ctx.membershipId,
      notes: input.notes ?? null,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "governance.ai_datause.requested",
    entityType: "AiDataUseApproval",
    entityId: upserted.id,
    severity: "WARNING",
    summary: `AI data-use approval requested for ${input.useType}`,
  });
  return upserted;
}

export async function decideAiDataUseApproval(
  ctx: TenantContext,
  approvalId: string,
  decision: "APPROVED" | "REJECTED" | "BLOCKED",
  notes?: string,
) {
  assertPermission(ctx, "ai.datause.approve");
  const approval = await prisma.aiDataUseApproval.findFirst({
    where: { id: approvalId, tenantId: ctx.tenantId },
  });
  if (!approval) throw ApiError.notFound("Approval request not found");
  // Categories flagged RESTRICTED cannot be approved into shared-model use
  // without a dedicated review flow — enforce fail-closed here too.
  if (decision === "APPROVED") {
    const ids = approval.dataCategoryIds as string[];
    const restricted = await prisma.dataCategory.count({
      where: { id: { in: ids }, tenantId: ctx.tenantId, classification: "RESTRICTED" },
    });
    if (restricted > 0 && approval.useType !== "OUTPUT_EVALUATION") {
      throw ApiError.conflict("RESTRICTED categories require elevated privacy review before approval");
    }
  }
  const updated = await prisma.aiDataUseApproval.update({
    where: { id: approvalId },
    data: { status: decision, decidedBy: ctx.user.id, decidedAt: new Date(), notes: notes ?? approval.notes },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: `governance.ai_datause.${decision.toLowerCase()}`,
    entityType: "AiDataUseApproval",
    entityId: updated.id,
    severity: "CRITICAL",
    summary: `AI data-use ${approval.useType} ${decision}`,
  });
  return updated;
}

// ---------------------------------------------------------------------------
// Export controls
// ---------------------------------------------------------------------------

/**
 * Create an export job. The scope must name registered data categories only;
 * exports of RESTRICTED categories are blocked unless their primary-purpose
 * processing activity is approved. Row extraction itself is performed by the
 * caller with TENANT-SCOPED queries — this layer guarantees the governance
 * bookkeeping, expiry, and audit trail.
 */
export async function createExportJob(
  ctx: TenantContext,
  input: { scope: string; categoryCodes: string[] },
) {
  assertPermission(ctx, "governance.read");
  const categories = await prisma.dataCategory.findMany({
    where: { tenantId: ctx.tenantId, code: { in: input.categoryCodes } },
  });
  if (categories.length !== input.categoryCodes.length) {
    throw ApiError.validation("Unknown data category in export scope");
  }
  for (const cat of categories) {
    if (cat.classification === "RESTRICTED") {
      const permitted = await isProcessingPermitted(
        ctx.tenantId,
        "saas_delivery",
        cat.code,
      );
      if (!permitted.permitted) {
        throw ApiError.forbidden(`Export of RESTRICTED category '${cat.code}' is not authorized`);
      }
    }
  }
  const job = await prisma.exportJob.create({
    data: {
      tenantId: ctx.tenantId,
      requestedByMembershipId: ctx.membershipId,
      scope: input.scope,
      // Artifacts expire; retrieval checks expiresAt server-side.
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "governance.export.created",
    entityType: "ExportJob",
    entityId: job.id,
    severity: "WARNING",
    summary: `Export job created (scope=${input.scope}, categories=${input.categoryCodes.join(",")})`,
  });
  return job;
}

/** Complete a job with counts recorded; artifact path stored for controlled
 *  retrieval. Never store row contents in the DB or logs. */
export async function completeExportJob(
  ctx: TenantContext,
  jobId: string,
  result: { artifactPath: string; rowCount: number },
) {
  assertPermission(ctx, "governance.read");
  const job = await prisma.exportJob.findFirst({
    where: { id: jobId, tenantId: ctx.tenantId },
  });
  if (!job) throw ApiError.notFound("Export job not found");
  if (job.status !== "PENDING" && job.status !== "RUNNING") {
    throw ApiError.conflict(`Export job already ${job.status}`);
  }
  return prisma.exportJob.update({
    where: { id: jobId },
    data: { status: "COMPLETED", artifactPath: result.artifactPath, rowCount: result.rowCount },
  });
}

export async function failExportJob(ctx: TenantContext, jobId: string, reason: string) {
  assertPermission(ctx, "governance.read");
  const job = await prisma.exportJob.findFirst({
    where: { id: jobId, tenantId: ctx.tenantId },
  });
  if (!job) throw ApiError.notFound("Export job not found");
  // Safe message only — never embed row data or internal stack details.
  return prisma.exportJob.update({
    where: { id: jobId },
    data: { status: "FAILED", failureReason: reason.slice(0, 500) },
  });
}

// ---------------------------------------------------------------------------
// Marketplace candidate products (foundation only — NO live release path)
// ---------------------------------------------------------------------------

const RELEASE_GATES = [
  "legalReview",
  "privacyReview",
  "reidentificationRiskReview",
  "securityReview",
  "dataQualityReview",
  "commercialDisclosureReview",
] as const;

export async function createMarketplaceProduct(
  _ctx: TenantContext,
  input: {
    productCode: string;
    version?: number;
    title: string;
    buyerCategory?: string;
    intendedUseCase?: string;
    aggregationMethod?: string;
    includedFields?: string[];
    excludedFields?: string[];
    minGroupSize?: number | null;
    contributingTenantIds?: string[];
    purposeCodes?: string[];
  },
) {
  // Platform-level capability: tenant roles never grant marketplace admin.
  assertPermission(_ctx, "marketplace.admin");
  const product = await prisma.marketplaceProduct.create({
    data: {
      productCode: input.productCode,
      version: input.version ?? 1,
      title: input.title,
      buyerCategory: input.buyerCategory ?? null,
      intendedUseCase: input.intendedUseCase ?? null,
      aggregationMethod: input.aggregationMethod ?? null,
      includedFields: input.includedFields ?? [],
      excludedFields: input.excludedFields ?? ["*direct_identifiers"],
      minGroupSize: input.minGroupSize ?? null,
      contributingTenantIds: input.contributingTenantIds ?? [],
      purposeCodes: input.purposeCodes ?? [],
    },
  });
  await recordAuditEvent({
    tenantId: null,
    userId: _ctx.user.id,
    membershipId: _ctx.membershipId,
    action: "marketplace.product.created",
    entityType: "MarketplaceProduct",
    entityId: product.id,
    severity: "WARNING",
    summary: `Candidate product '${input.productCode}' v${product.version} created (DRAFT)`,
  });
  return product;
}

export async function recordGateDecision(
  ctx: TenantContext,
  productId: string,
  gate: (typeof RELEASE_GATES)[number],
  decision: ReviewStatus,
  reason?: string,
  policyVersion?: string,
) {
  assertPermission(ctx, "marketplace.admin");
  const product = await prisma.marketplaceProduct.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound("Product not found");
  if (product.status === "RELEASED") {
    throw ApiError.conflict("Cannot change gate decisions after release; withdraw first");
  }
  await prisma.$transaction([
    prisma.marketplaceProduct.update({ where: { id: productId }, data: { [gate]: decision } }),
    prisma.marketplaceApprovalDecision.create({
      data: {
        productId,
        gate,
        decision,
        reviewer: ctx.user.id,
        reason: reason ?? null,
        policyVersion: policyVersion ?? null,
      },
    }),
  ]);
  await recordAuditEvent({
    tenantId: null,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: `marketplace.gate.${decision.toLowerCase()}`,
    entityType: "MarketplaceProduct",
    entityId: productId,
    severity: "WARNING",
    summary: `Gate '${gate}' -> ${decision} on '${product.productCode}'`,
  });
  return prisma.marketplaceProduct.findUnique({ where: { id: productId } });
}

/**
 * Attempt release. FAILS CLOSED unless:
 * - every review gate is PASSED,
 * - an approved minimum group size is configured (unapproved thresholds are
 *   rejected rather than invented),
 * - all contributing tenants have APPROVED COMMERCIAL_INTELLIGENCE data use
 *   (no tenant's data may enter a product without their recorded approval).
 */
export async function authorizeMarketplaceRelease(
  ctx: TenantContext,
  productId: string,
) {
  assertPermission(ctx, "marketplace.admin");
  const product = await prisma.marketplaceProduct.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound("Product not found");
  if (product.status !== "APPROVED" && product.status !== "IN_REVIEW") {
    throw ApiError.conflict(`Cannot release from status ${product.status}`);
  }

  const blockers: string[] = [];
  for (const gate of RELEASE_GATES) {
    if (product[gate] !== "PASSED") blockers.push(`gate_not_passed:${gate}`);
  }
  if (product.minGroupSize === null || product.minGroupSize < 1) {
    blockers.push("min_group_size_unconfigured");
  }
  const contributors = product.contributingTenantIds as string[];
  if (contributors.length === 0) blockers.push("no_contributing_tenants");
  for (const tenantId of contributors) {
    const consent = await prisma.consentRecord.findFirst({
      where: { tenantId, purposeCode: "marketplace_release", granted: true, withdrawnAt: null },
    });
    if (!consent) blockers.push(`tenant_consent_missing:${tenantId}`);
    const approval = await prisma.aiDataUseApproval.findUnique({
      where: { tenantId_useType: { tenantId, useType: "COMMERCIAL_INTELLIGENCE" } },
    });
    if (!approval || approval.status !== "APPROVED") {
      blockers.push(`tenant_ai_use_not_approved:${tenantId}`);
    }
  }
  if (blockers.length > 0) {
    await recordAuditEvent({
      tenantId: null,
      userId: ctx.user.id,
      membershipId: ctx.membershipId,
      action: "marketplace.release.blocked",
      entityType: "MarketplaceProduct",
      entityId: productId,
      severity: "CRITICAL",
      summary: `Release blocked for '${product.productCode}': ${blockers.join("; ")}`,
    });
    throw ApiError.conflict(`Release blocked: ${blockers.join("; ")}`);
  }

  const updated = await prisma.marketplaceProduct.update({
    where: { id: productId },
    data: {
      status: "RELEASED",
      releaseAuthorizedBy: ctx.user.id,
      releaseAuthorizedAt: new Date(),
    },
  });
  await recordAuditEvent({
    tenantId: null,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "marketplace.release.authorized",
    entityType: "MarketplaceProduct",
    entityId: productId,
    severity: "CRITICAL",
    summary: `Release AUTHORIZED (metadata only) for '${product.productCode}' v${product.version}`,
  });
  return updated;
}

export async function withdrawMarketplaceProduct(
  ctx: TenantContext,
  productId: string,
  reason: string,
) {
  assertPermission(ctx, "marketplace.admin");
  const product = await prisma.marketplaceProduct.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound("Product not found");
  if (product.status === "WITHDRAWN") return product;
  const updated = await prisma.marketplaceProduct.update({
    where: { id: productId },
    data: { status: "WITHDRAWN", withdrawnReason: reason },
  });
  await recordAuditEvent({
    tenantId: null,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "marketplace.product.withdrawn",
    entityType: "MarketplaceProduct",
    entityId: productId,
    severity: "CRITICAL",
    summary: `Product '${product.productCode}' withdrawn: ${reason}`,
  });
  return updated;
}

// ---------------------------------------------------------------------------
// Third-party sharing arrangements
// ---------------------------------------------------------------------------

/** A transfer is authorized ONLY when contractual review passed AND the
 *  authorization state is APPROVED AND the arrangement is ACTIVE. Anything
 *  else fails closed. */
export async function isSharingAuthorized(recipientName: string, purposeCode: string) {
  const arrangement = await prisma.dataSharingArrangement.findUnique({
    where: {
      recipientName_purposeCode: { recipientName, purposeCode },
    },
  });
  if (!arrangement) return { authorized: false, reason: "no_arrangement" };
  if (arrangement.status !== "ACTIVE") return { authorized: false, reason: `status_${arrangement.status}` };
  if (arrangement.contractualReviewStatus !== "PASSED") {
    return { authorized: false, reason: "contractual_review_incomplete" };
  }
  if (arrangement.authorizationStatus !== "APPROVED") {
    return { authorized: false, reason: "authorization_not_approved" };
  }
  return { authorized: true, reason: "ok" };
}

// ---------------------------------------------------------------------------
// Data incidents
// ---------------------------------------------------------------------------

export async function openDataIncident(
  ctx: TenantContext,
  input: {
    type: Parameters<typeof prisma.dataIncident.create>[0]["data"]["type"];
    summary: string;
    affectedResourceRefs?: string[];
    assignedToMembershipId?: string;
  },
) {
  assertPermission(ctx, "governance.incidents.manage");
  const incident = await prisma.dataIncident.create({
    data: {
      tenantId: ctx.tenantId,
      type: input.type,
      summary: input.summary.slice(0, 2000), // bounded: no raw records in incident text
      affectedResourceRefs: input.affectedResourceRefs ?? [],
      assignedToMembershipId: input.assignedToMembershipId ?? null,
      openedBy: ctx.user.id,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "governance.incident.opened",
    entityType: "DataIncident",
    entityId: incident.id,
    severity: "CRITICAL",
    summary: `Data incident opened: ${incident.type}`,
  });
  return incident;
}

const INCIDENT_TRANSITIONS: Record<string, string[]> = {
  OPEN: ["CONTAINED", "UNDER_INVESTIGATION"],
  CONTAINED: ["UNDER_INVESTIGATION"],
  UNDER_INVESTIGATION: ["RESOLVED", "CONTAINED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export async function transitionIncident(
  ctx: TenantContext,
  incidentId: string,
  to: "CONTAINED" | "UNDER_INVESTIGATION" | "RESOLVED" | "CLOSED",
  notes?: string,
) {
  assertPermission(ctx, "governance.incidents.manage");
  const incident = await prisma.dataIncident.findFirst({
    where: { id: incidentId, tenantId: ctx.tenantId },
  });
  if (!incident) throw ApiError.notFound("Incident not found");
  if (!(INCIDENT_TRANSITIONS[incident.status] ?? []).includes(to)) {
    throw ApiError.conflict(`Invalid incident transition ${incident.status} -> ${to}`);
  }
  return prisma.dataIncident.update({
    where: { id: incidentId },
    data: {
      status: to,
      resolvedAt: to === "RESOLVED" ? new Date() : incident.resolvedAt,
      remediationNotes: notes ?? incident.remediationNotes,
    },
  });
}
