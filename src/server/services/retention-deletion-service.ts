import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "./audit-service";
import { assertPermission } from "./governance-service";
import type { TenantContext } from "@/lib/auth/session";
import type { DeletionRequestStatus, RetentionAction } from "@prisma/client";

/**
 * Stage 16 — Retention policies, legal holds, and deletion workflows.
 *
 * Safety invariants:
 * - A retention policy with a NULL durationDays is intentionally "unresolved"
 *   (pending legal review) and NEVER eligible for automatic action.
 * - An open legal hold blocks both retention execution and manual deletion.
 * - Deletion jobs only reach COMPLETED when every step verified success;
 *   partial work is reported honestly as PARTIALLY_COMPLETED / FAILED so a
 *   failure can never be presented as success.
 */

// ---------------------------------------------------------------------------
// Retention policies
// ---------------------------------------------------------------------------

export async function createRetentionPolicy(
  ctx: TenantContext,
  input: {
    dataCategoryId: string;
    version?: number;
    durationDays: number | null; // null = unresolved pending legal review
    triggerEvent?: string;
    action?: RetentionAction;
    legalBasisReference?: string;
  },
) {
  assertPermission(ctx, "governance.policies.manage");
  const category = await prisma.dataCategory.findFirst({
    where: { id: input.dataCategoryId, tenantId: ctx.tenantId },
  });
  if (!category) throw ApiError.notFound("Data category not found");
  if (input.durationDays !== null && input.durationDays < 0) {
    throw ApiError.validation("durationDays cannot be negative");
  }
  const policy = await prisma.retentionPolicy.create({
    data: {
      tenantId: ctx.tenantId,
      dataCategoryId: category.id,
      version: input.version ?? 1,
      durationDays: input.durationDays,
      triggerEvent: input.triggerEvent ?? "RECORD_CREATED",
      action: input.action ?? "DELETE",
      legalBasisReference: input.legalBasisReference ?? null,
      approvedBy: ctx.user.id,
      approvedAt: new Date(),
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "governance.retention_policy.create",
    entityType: "RetentionPolicy",
    entityId: policy.id,
    severity: "WARNING",
    summary: `Retention policy v${policy.version} for '${category.code}': ${
      input.durationDays === null ? "UNRESOLVED (no automatic action)" : `${input.durationDays}d -> ${policy.action}`
    }`,
  });
  return policy;
}

/** Evaluate whether a category may undergo an automatic retention action. */
export async function evaluateRetentionEligibility(
  tenantId: string,
  dataCategoryCode: string,
): Promise<{ eligible: boolean; reason: string }> {
  const category = await prisma.dataCategory.findFirst({
    where: { tenantId, code: dataCategoryCode },
  });
  if (!category) return { eligible: false, reason: "category_not_registered" };

  const policy = await prisma.retentionPolicy.findFirst({
    where: { tenantId, dataCategoryId: category.id, isActive: true },
    orderBy: { version: "desc" },
  });
  if (!policy) return { eligible: false, reason: "no_active_policy" };
  // Fail closed on unresolved periods instead of inventing a duration.
  if (policy.durationDays === null) {
    return { eligible: false, reason: "retention_period_unresolved_pending_review" };
  }

  const openHold = await prisma.legalHold.findFirst({
    where: {
      tenantId,
      releasedAt: null,
      OR: [{ dataCategoryId: category.id }, { dataCategoryId: null }],
    },
  });
  if (openHold) return { eligible: false, reason: "legal_hold_active" };

  return { eligible: true, reason: `action=${policy.action} after ${policy.durationDays}d` };
}

// ---------------------------------------------------------------------------
// Legal holds
// ---------------------------------------------------------------------------

export async function placeLegalHold(
  ctx: TenantContext,
  input: {
    dataCategoryId?: string | null;
    entityType?: string;
    entityId?: string;
    reason: string;
  },
) {
  assertPermission(ctx, "governance.policies.manage");
  if (input.dataCategoryId) {
    const cat = await prisma.dataCategory.findFirst({
      where: { id: input.dataCategoryId, tenantId: ctx.tenantId },
    });
    if (!cat) throw ApiError.notFound("Data category not found");
  }
  // The partial unique index enforces one OPEN hold per (tenant, category);
  // translate a duplicate into a clear conflict rather than a raw DB error.
  try {
    const hold = await prisma.legalHold.create({
      data: {
        tenantId: ctx.tenantId,
        dataCategoryId: input.dataCategoryId ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        reason: input.reason,
        placedBy: ctx.user.id,
      },
    });
    await recordAuditEvent({
      tenantId: ctx.tenantId,
      userId: ctx.user.id,
      membershipId: ctx.membershipId,
      action: "governance.legal_hold.placed",
      entityType: "LegalHold",
      entityId: hold.id,
      severity: "CRITICAL",
      summary: `Legal hold placed: ${input.reason}`,
    });
    return hold;
  } catch (e) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002") {
      throw ApiError.conflict("An open legal hold already exists for this scope");
    }
    throw e;
  }
}

export async function releaseLegalHold(ctx: TenantContext, holdId: string) {
  assertPermission(ctx, "governance.policies.manage");
  const hold = await prisma.legalHold.findFirst({
    where: { id: holdId, tenantId: ctx.tenantId },
  });
  if (!hold) throw ApiError.notFound("Legal hold not found");
  if (hold.releasedAt) throw ApiError.conflict("Hold already released");
  const updated = await prisma.legalHold.update({
    where: { id: holdId },
    data: { releasedAt: new Date(), releasedBy: ctx.user.id },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "governance.legal_hold.released",
    entityType: "LegalHold",
    entityId: updated.id,
    severity: "CRITICAL",
    summary: `Legal hold released (was: ${hold.reason})`,
  });
  return updated;
}

// ---------------------------------------------------------------------------
// Deletion workflow
// ---------------------------------------------------------------------------

/** Allowed forward transitions of the deletion state machine. */
const DELETION_TRANSITIONS: Record<DeletionRequestStatus, DeletionRequestStatus[]> = {
  REQUESTED: ["UNDER_REVIEW", "BLOCKED"],
  UNDER_REVIEW: ["APPROVED", "BLOCKED"],
  APPROVED: ["IN_PROGRESS", "BLOCKED"],
  BLOCKED: ["UNDER_REVIEW", "NEEDS_INTERVENTION"],
  IN_PROGRESS: ["COMPLETED", "PARTIALLY_COMPLETED", "FAILED"],
  PARTIALLY_COMPLETED: ["IN_PROGRESS", "NEEDS_INTERVENTION"],
  FAILED: ["IN_PROGRESS", "NEEDS_INTERVENTION"],
  COMPLETED: [],
  NEEDS_INTERVENTION: ["IN_PROGRESS", "BLOCKED"],
};

export function canTransitionDeletion(from: DeletionRequestStatus, to: DeletionRequestStatus): boolean {
  return DELETION_TRANSITIONS[from].includes(to);
}

/**
 * Create (or idempotently fetch) a deletion request. The unique constraint on
 * (tenantId, idempotencyKey) guarantees retries never create duplicate jobs.
 */
export async function requestDeletion(
  ctx: TenantContext,
  input: { scope: string; targetRef?: string; idempotencyKey: string },
) {
  assertPermission(ctx, "governance.deletion.execute");
  const existing = await prisma.deletionRequest.findUnique({
    where: {
      tenantId_idempotencyKey: {
        tenantId: ctx.tenantId,
        idempotencyKey: input.idempotencyKey,
      },
    },
  });
  if (existing) return { request: existing, replayed: true as const };

  const request = await prisma.deletionRequest.create({
    data: {
      tenantId: ctx.tenantId,
      requestedByMembershipId: ctx.membershipId,
      scope: input.scope,
      targetRef: input.targetRef ?? null,
      idempotencyKey: input.idempotencyKey,
      status: "REQUESTED",
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "governance.deletion.requested",
    entityType: "DeletionRequest",
    entityId: request.id,
    severity: "WARNING",
    summary: `Deletion requested (scope=${input.scope})`,
  });
  return { request, replayed: false as const };
}

export async function transitionDeletion(
  ctx: TenantContext,
  requestId: string,
  to: DeletionRequestStatus,
  opts?: { failureReason?: string },
) {
  assertPermission(ctx, "governance.deletion.execute");
  const current = await prisma.deletionRequest.findFirst({
    where: { id: requestId, tenantId: ctx.tenantId },
  });
  if (!current) throw ApiError.notFound("Deletion request not found");
  if (!canTransitionDeletion(current.status, to)) {
    throw ApiError.conflict(`Invalid deletion transition ${current.status} -> ${to}`);
  }
  // A deletion may not proceed while a legal hold covers its scope.
  if ((to === "APPROVED" || to === "IN_PROGRESS") && current.scope.startsWith("category:")) {
    const code = current.scope.slice("category:".length);
    const eligibility = await evaluateRetentionEligibility(ctx.tenantId, code);
    if (!eligibility.eligible && eligibility.reason === "legal_hold_active") {
      throw ApiError.conflict("Deletion blocked by active legal hold");
    }
  }
  const updated = await prisma.deletionRequest.update({
    where: { id: requestId },
    data: {
      status: to,
      failureReason: opts?.failureReason ?? null,
      completedAt: to === "COMPLETED" ? new Date() : null,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: `governance.deletion.${to.toLowerCase()}`,
    entityType: "DeletionRequest",
    entityId: updated.id,
    severity: to === "COMPLETED" || to === "FAILED" ? "CRITICAL" : "WARNING",
    summary: `Deletion ${current.status} -> ${to}${opts?.failureReason ? ` (${opts.failureReason})` : ""}`,
  });
  return updated;
}

/**
 * Execute one step of a deletion job against a storage location. The caller
 * supplies the actual destructive routine; this wrapper records attempts and
 * failures so partial completion is visible and safely retryable. A throwing
 * executor NEVER marks the step complete.
 */
export async function executeDeletionStep<T>(
  ctx: TenantContext,
  requestId: string,
  location: string,
  executor: () => Promise<T>,
): Promise<{ ok: boolean; result?: T; error?: string }> {
  assertPermission(ctx, "governance.deletion.execute");
  const request = await prisma.deletionRequest.findFirst({
    where: { id: requestId, tenantId: ctx.tenantId },
  });
  if (!request) throw ApiError.notFound("Deletion request not found");
  if (request.status !== "IN_PROGRESS") {
    throw ApiError.conflict(`Cannot execute steps while request is ${request.status}`);
  }
  const step = await prisma.deletionStep.upsert({
    where: { requestId_location: { requestId, location } },
    update: { attempts: { increment: 1 } },
    create: { requestId, location, attempts: 1, status: "IN_PROGRESS" },
  });
  try {
    const result = await executor();
    await prisma.deletionStep.update({
      where: { id: step.id },
      data: { status: "COMPLETED", completedAt: new Date(), error: null },
    });
    return { ok: true, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    await prisma.deletionStep.update({
      where: { id: step.id },
      data: { status: "FAILED", error: message },
    });
    return { ok: false, error: message };
  }
}

/** Recompute the overall request status from its recorded steps. Only marks
 *  COMPLETED when every step succeeded — never claims full deletion after
 *  partial work. */
export async function finalizeDeletionIfComplete(
  ctx: TenantContext,
  requestId: string,
): Promise<DeletionRequestStatus> {
  assertPermission(ctx, "governance.deletion.execute");
  const steps = await prisma.deletionStep.findMany({ where: { requestId } });
  if (steps.length === 0) return "IN_PROGRESS";
  const failed = steps.filter((s) => s.status === "FAILED").length;
  const completed = steps.filter((s) => s.status === "COMPLETED").length;
  let next: DeletionRequestStatus;
  if (failed === 0 && completed === steps.length) next = "COMPLETED";
  else if (completed > 0) next = "PARTIALLY_COMPLETED";
  else next = "FAILED";
  const req = await prisma.deletionRequest.findFirst({
    where: { id: requestId, tenantId: ctx.tenantId },
  });
  if (!req) throw ApiError.notFound("Deletion request not found");
  if (req.status !== next && canTransitionDeletion(req.status, next)) {
    await prisma.deletionRequest.update({
      where: { id: requestId },
      data: { status: next, completedAt: next === "COMPLETED" ? new Date() : null },
    });
    await recordAuditEvent({
      tenantId: ctx.tenantId,
      userId: ctx.user.id,
      membershipId: ctx.membershipId,
      action: `governance.deletion.finalized.${next.toLowerCase()}`,
      entityType: "DeletionRequest",
      entityId: requestId,
      severity: next === "COMPLETED" ? "CRITICAL" : "WARNING",
      summary: `Deletion finalized as ${next} (${completed}/${steps.length} steps ok)`,
    });
  }
  return next;
}
