import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "./audit-service";
import type { TenantContext } from "@/lib/auth/session";
import type {
  DataClassification,
  ConsentSubjectType,
  ProcessingApprovalState,
} from "@prisma/client";

/**
 * Stage 16 — Data governance foundation.
 *
 * Design rules enforced here:
 * 1. Every operation is tenant-scoped from the SERVER-SIDE TenantContext;
 *    client-supplied tenant ids are never accepted.
 * 2. Fail-closed: a missing approval/consent/policy record means the
 *    processing activity is NOT permitted. Absence of a prohibition is not
 *    permission.
 * 3. Distinct actions require distinct permissions (least privilege) and
 *    every sensitive mutation writes an audit event.
 */

export function assertPermission(ctx: TenantContext, permission: string): void {
  if (!ctx.permissions.has(permission as never)) {
    throw ApiError.forbidden(`Missing permission: ${permission}`);
  }
}

// ---------------------------------------------------------------------------
// Data classification / categories
// ---------------------------------------------------------------------------

export async function upsertDataCategory(
  ctx: TenantContext,
  input: {
    code: string;
    name: string;
    classification: DataClassification;
    isPersonalData?: boolean;
    aiUseAllowed?: boolean;
    marketplaceEligible?: boolean;
  },
) {
  assertPermission(ctx, "governance.policies.manage");
  // Classification changes are security-sensitive: only policy managers may
  // raise or lower sensitivity, and each change is audited.
  const category = await prisma.dataCategory.upsert({
    where: { tenantId_code: { tenantId: ctx.tenantId, code: input.code } },
    update: {
      name: input.name,
      classification: input.classification,
      isPersonalData: input.isPersonalData ?? false,
      // Explicit downgrade guard: AI use and marketplace eligibility can be
      // revoked freely but NEVER granted implicitly by a routine upsert.
      ...(input.aiUseAllowed === true ? {} : { aiUseAllowed: false }),
      ...(input.marketplaceEligible === true ? {} : { marketplaceEligible: false }),
    },
    create: {
      tenantId: ctx.tenantId,
      code: input.code,
      name: input.name,
      classification: input.classification,
      isPersonalData: input.isPersonalData ?? false,
      // New categories start with secondary-use flags OFF (fail closed).
      aiUseAllowed: false,
      marketplaceEligible: false,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "governance.data_category.upsert",
    entityType: "DataCategory",
    entityId: category.id,
    severity: "WARNING",
    summary: `Data category '${input.code}' classified as ${input.classification}`,
  });
  return category;
}

/** Grant AI-use for a category — separate explicit call so it cannot happen
 *  accidentally through a normal classification edit. */
export async function setCategorySecondaryUseFlags(
  ctx: TenantContext,
  categoryId: string,
  flags: { aiUseAllowed?: boolean; marketplaceEligible?: boolean },
) {
  assertPermission(ctx, "governance.policies.manage");
  // Scoped lookup: cross-tenant ids resolve to nothing (no existence leak).
  const existing = await prisma.dataCategory.findFirst({
    where: { id: categoryId, tenantId: ctx.tenantId },
  });
  if (!existing) throw ApiError.notFound("Data category not found");
  const updated = await prisma.dataCategory.update({
    where: { id: categoryId },
    data: {
      ...(flags.aiUseAllowed !== undefined ? { aiUseAllowed: flags.aiUseAllowed } : {}),
      ...(flags.marketplaceEligible !== undefined
        ? { marketplaceEligible: flags.marketplaceEligible }
        : {}),
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "governance.data_category.secondary_use_change",
    entityType: "DataCategory",
    entityId: updated.id,
    severity: "WARNING",
    summary: `Secondary-use flags changed on '${updated.code}': ai=${updated.aiUseAllowed} mp=${updated.marketplaceEligible}`,
  });
  return updated;
}

// ---------------------------------------------------------------------------
// Processing purposes + per-category approval state
// ---------------------------------------------------------------------------

export async function registerProcessingPurpose(
  ctx: TenantContext,
  input: { code: string; name: string; requiresConsent?: boolean; externalSharingRestricted?: boolean },
) {
  assertPermission(ctx, "governance.policies.manage");
  const purpose = await prisma.processingPurpose.create({
    data: {
      // Tenant-scoped purposes get the acting tenant; platform registries are
      // created through platform services instead.
      tenantId: ctx.tenantId,
      code: `${ctx.tenantId.slice(-4)}_${input.code}`,
      name: input.name,
      requiresConsent: input.requiresConsent ?? false,
      externalSharingRestricted: input.externalSharingRestricted ?? true,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "governance.purpose.register",
    entityType: "ProcessingPurpose",
    entityId: purpose.id,
    summary: `Registered processing purpose '${input.name}'`,
  });
  return purpose;
}

/**
 * THE central fail-closed check used by other modules (AI, exports,
 * analytics) before touching governed data for a secondary purpose.
 */
export async function isProcessingPermitted(
  tenantId: string,
  purposeCode: string,
  dataCategoryCode: string,
): Promise<{ permitted: boolean; reason: string }> {
  const purpose = await prisma.processingPurpose.findUnique({
    where: { code: purposeCode },
  });
  if (!purpose || purpose.status !== "ACTIVE") {
    return { permitted: false, reason: "purpose_missing_or_disabled" };
  }
  // A global (platform) purpose has null tenantId; a tenant purpose must
  // belong to this tenant. Either way, cross-tenant reuse is impossible.
  if (purpose.tenantId !== null && purpose.tenantId !== tenantId) {
    return { permitted: false, reason: "purpose_not_for_this_tenant" };
  }

  if (purpose.requiresConsent) {
    const active = await prisma.consentRecord.findFirst({
      where: { tenantId, purposeCode, withdrawnAt: null, granted: true },
      orderBy: { recordedAt: "desc" },
    });
    if (!active) return { permitted: false, reason: "consent_missing_or_withdrawn" };
  }

  const category = await prisma.dataCategory.findFirst({
    where: { tenantId, code: dataCategoryCode },
  });
  if (!category) return { permitted: false, reason: "category_not_registered" };

  const activity = await prisma.processingActivity.findFirst({
    where: { purposeId: purpose.id, dataCategoryId: category.id },
  });
  if (!activity || activity.state !== "APPROVED") {
    return { permitted: false, reason: "processing_activity_not_approved" };
  }
  return { permitted: true, reason: "approved" };
}

export async function approveProcessingActivity(
  ctx: TenantContext,
  purposeId: string,
  dataCategoryId: string,
  decision: Extract<ProcessingApprovalState, "APPROVED" | "REJECTED" | "BLOCKED">,
  reason?: string,
) {
  assertPermission(ctx, "governance.policies.manage");
  // Both referenced records must belong to the acting tenant — prevents
  // approving activities that mix another tenant's category.
  const [purpose, category] = await Promise.all([
    prisma.processingPurpose.findFirst({ where: { id: purposeId, tenantId: ctx.tenantId } }),
    prisma.dataCategory.findFirst({ where: { id: dataCategoryId, tenantId: ctx.tenantId } }),
  ]);
  if (!purpose) throw ApiError.notFound("Purpose not found");
  if (!category) throw ApiError.notFound("Data category not found");

  const activity = await prisma.processingActivity.upsert({
    where: { purposeId_dataCategoryId: { purposeId, dataCategoryId } },
    update: {
      state: decision,
      approvedBy: ctx.user.id,
      approvedAt: new Date(),
      reason: reason ?? null,
    },
    create: {
      purposeId,
      dataCategoryId,
      state: decision,
      approvedBy: ctx.user.id,
      approvedAt: new Date(),
      reason: reason ?? null,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: `governance.activity.${decision.toLowerCase()}`,
    entityType: "ProcessingActivity",
    entityId: activity.id,
    severity: "WARNING",
    summary: `Processing activity ${decision} for purpose '${purpose.code}' / category '${category.code}'`,
  });
  return activity;
}

// ---------------------------------------------------------------------------
// Consent ledger (append-only, versioned, withdrawal-aware)
// ---------------------------------------------------------------------------

export async function recordConsentDecision(
  ctx: TenantContext,
  input: {
    subjectType: ConsentSubjectType;
    purposeCode: string;
    policyVersion: string;
    granted: boolean;
    collectionMethod: string;
    userId?: string;
    evidence?: string;
  },
) {
  // Users may record consent for THEMSELVES without any special permission;
  // managing others' consent requires governance rights.
  if (input.subjectType === "USER" && input.userId && input.userId !== ctx.user.id) {
    assertPermission(ctx, "governance.policies.manage");
  }
  if (input.subjectType === "ORGANIZATION") {
    assertPermission(ctx, "governance.policies.manage");
  }

  // Appending a decision never overwrites history. If granting, first close
  // any currently-active row for the same subject+purpose so exactly one
  // ACTIVE grant exists; withdrawal is modelled by closing the active row.
  const activeWhere = {
    tenantId: ctx.tenantId,
    purposeCode: input.purposeCode,
    subjectType: input.subjectType,
    userId: input.subjectType === "USER" ? input.userId ?? null : null,
    withdrawnAt: null,
  };
  if (input.granted) {
    await prisma.consentRecord.updateMany({
      where: activeWhere,
      data: { withdrawnAt: new Date() },
    });
  }

  const record = await prisma.consentRecord.create({
    data: {
      tenantId: ctx.tenantId,
      userId: input.subjectType === "USER" ? input.userId ?? null : null,
      subjectType: input.subjectType,
      purposeCode: input.purposeCode,
      policyVersion: input.policyVersion,
      granted: input.granted,
      collectionMethod: input.collectionMethod,
      evidence: input.evidence ?? null,
      // A non-granted decision is recorded as withdrawn immediately so the
      // "one active row" invariant holds uniformly.
      withdrawnAt: input.granted ? null : new Date(),
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: input.granted ? "governance.consent.granted" : "governance.consent.declined",
    entityType: "ConsentRecord",
    entityId: record.id,
    summary: `Consent ${input.granted ? "granted" : "declined"} for purpose '${input.purposeCode}' (policy v${input.policyVersion})`,
  });
  return record;
}

/** Withdraw the currently-active consent for a subject+purpose. Returns the
 *  number of active rows closed (0 means there was nothing to withdraw). */
export async function withdrawConsent(
  ctx: TenantContext,
  input: { purposeCode: string; subjectType: ConsentSubjectType; userId?: string },
): Promise<number> {
  if (input.subjectType === "USER" && input.userId && input.userId !== ctx.user.id) {
    assertPermission(ctx, "governance.policies.manage");
  }
  const now = new Date();
  // Append-only ledger: instead of only stamping withdrawnAt on the original
  // row, we close the active grant AND insert an explicit withdrawal entry.
  // This preserves a durable, queryable record of WHEN and BY WHOM consent
  // was withdrawn (regulatory evidence), while the "one active row" invariant
  // is maintained by closing prior grants first.
  const activeWhere = {
    tenantId: ctx.tenantId,
    purposeCode: input.purposeCode,
    subjectType: input.subjectType,
    userId: input.subjectType === "USER" ? input.userId ?? null : null,
    withdrawnAt: null,
    granted: true,
  };
  const closed = await prisma.consentRecord.updateMany({
    where: activeWhere,
    data: { withdrawnAt: now },
  });
  if (closed.count > 0) {
    await prisma.consentRecord.create({
      data: {
        tenantId: ctx.tenantId,
        userId: input.subjectType === "USER" ? input.userId ?? null : null,
        subjectType: input.subjectType,
        purposeCode: input.purposeCode,
        // Version marker ties the withdrawal to the policy text it applied to.
        policyVersion: "withdrawal",
        granted: false,
        collectionMethod: "consent_withdrawal",
        withdrawnAt: now,
      },
    });
  }
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "governance.consent.withdrawn",
    entityType: "ConsentRecord",
    summary: `Consent withdrawal processed for purpose '${input.purposeCode}' (${closed.count} active record(s) closed)`,
    severity: "WARNING",
  });
  return closed.count;
}

export async function hasActiveConsent(
  tenantId: string,
  purposeCode: string,
  opts?: { userId?: string | null },
): Promise<boolean> {
  const active = await prisma.consentRecord.findFirst({
    where: {
      tenantId,
      purposeCode,
      granted: true,
      withdrawnAt: null,
      ...(opts?.userId !== undefined ? { userId: opts.userId } : {}),
    },
    orderBy: { recordedAt: "desc" },
  });
  return active !== null;
}
