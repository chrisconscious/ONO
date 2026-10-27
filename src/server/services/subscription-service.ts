import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "@/server/services/audit-service";
import type { BillingPeriod, Prisma, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

/**
 * SaaS subscription lifecycle service (Stage 14).
 *
 * Design rules enforced here:
 * - Status changes go through an explicit state machine; arbitrary writes to
 *   `status` are rejected.
 * - Entitlements come from PlanDefinition rows (commercial configuration),
 *   never hardcoded limits scattered across modules.
 * - Money is integer minor units only — no floating-point arithmetic.
 * - A subscription entitlement NEVER grants a user permission; permissions
 *   remain the exclusive domain of RBAC. Conversely, holding a permission
 *   does not bypass an entitlement restriction.
 */

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  PENDING_ACTIVATION: ["ACTIVE", "TRIALING", "TERMINATED"],
  TRIALING: ["ACTIVE", "PAST_DUE", "RESTRICTED", "CANCELLED", "EXPIRED", "SUSPENDED", "TERMINATED"],
  ACTIVE: ["PAST_DUE", "RESTRICTED", "SUSPENDED", "CANCELLED", "TERMINATED"],
  PAST_DUE: ["ACTIVE", "GRACE_PERIOD", "RESTRICTED", "SUSPENDED", "CANCELLED", "TERMINATED"],
  GRACE_PERIOD: ["ACTIVE", "RESTRICTED", "SUSPENDED", "CANCELLED", "EXPIRED", "TERMINATED"],
  RESTRICTED: ["ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED", "TERMINATED"],
  SUSPENDED: ["ACTIVE", "RESTRICTED", "CANCELLED", "TERMINATED"],
  // Cancelled keeps data but cannot silently return to paid states without
  // an explicit reactivation into PENDING_ACTIVATION / ACTIVE via admin.
  CANCELLED: ["PENDING_ACTIVATION", "TERMINATED"],
  EXPIRED: ["PENDING_ACTIVATION", "ACTIVE", "TRIALING", "TERMINATED"],
  TERMINATED: [],
};

export function canTransition(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// ---------------------------------------------------------------------------
// Period helpers (calendar-accurate month/year arithmetic)
// ---------------------------------------------------------------------------

export function addBillingPeriod(start: Date, period: BillingPeriod): Date {
  const end = new Date(start.getTime());
  if (period === "MONTHLY") {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }
  return end;
}

// ---------------------------------------------------------------------------
// Reading / listing
// ---------------------------------------------------------------------------

export async function getSubscription(tenantId: string) {
  const sub = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!sub) throw ApiError.notFound("Subscription not found");
  return sub;
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

async function transition(
  tenantId: string,
  to: SubscriptionStatus,
  actor: { userId: string },
  extra: Prisma.SubscriptionUpdateInput = {},
  action = "subscription.transition",
) {
  const sub = await getSubscription(tenantId);
  if (!canTransition(sub.status, to)) {
    throw ApiError.conflict(`Illegal subscription transition: ${sub.status} -> ${to}`);
  }
  const updated = await prisma.subscription.update({ where: { id: sub.id }, data: { status: to, ...extra } });
  await recordAuditEvent({
    tenantId,
    userId: actor.userId,
    action,
    entityType: "Subscription",
    entityId: sub.id,
    severity: "WARNING",
    summary: `Subscription moved ${sub.status} -> ${to}`,
  });
  return updated;
}

/** Activate after verified payment/onboarding. */
export async function activate(tenantId: string, actor: { userId: string }) {
  return transition(tenantId, "ACTIVE", actor, {}, "subscription.activate");
}

/** Mark payment failure (provider webhook confirmed only). */
export async function markPastDue(tenantId: string, actor: { userId: string }) {
  return transition(tenantId, "PAST_DUE", actor, {}, "subscription.past_due");
}

/** Move into grace period after past-due (still usable, renewal pending). */
export async function enterGracePeriod(tenantId: string, actor: { userId: string }) {
  return transition(tenantId, "GRACE_PERIOD", actor, {}, "subscription.grace");
}

/** Restrict non-essential modules while keeping data intact. */
export async function restrict(tenantId: string, actor: { userId: string }) {
  return transition(tenantId, "RESTRICTED", actor, {}, "subscription.restrict");
}

/** Suspend access entirely. Data is preserved — suspension is not deletion. */
export async function suspend(tenantId: string, actor: { userId: string }) {
  return transition(tenantId, "SUSPENDED", actor, {}, "subscription.suspend");
}

/**
 * Requested cancellation. By default this cancels renewal at period end and
 * preserves access until then; immediate termination requires an explicit
 * second step (`terminate`) so the two are never conflated.
 */
export async function cancel(
  tenantId: string,
  actor: { userId: string },
  opts?: { immediate?: boolean },
) {
  if (opts?.immediate) {
    return transition(tenantId, "CANCELLED", actor, { cancelledAt: new Date(), cancelAtPeriodEnd: false }, "subscription.cancel_immediate");
  }
  const sub = await getSubscription(tenantId);
  if (sub.status === "TERMINATED" || sub.status === "CANCELLED") {
    throw ApiError.conflict("Subscription is already cancelled or terminated");
  }
  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true },
  });
  await recordAuditEvent({
    tenantId,
    userId: actor.userId,
    action: "subscription.cancel_at_period_end",
    entityType: "Subscription",
    entityId: sub.id,
    summary: "Renewal disabled; access continues until current period end",
  });
  return updated;
}

/** Finalize a period-end cancellation when the period has elapsed. */
export async function finalizePeriodEndCancellation(tenantId: string, actor: { userId: string }) {
  const sub = await getSubscription(tenantId);
  if (!sub.cancelAtPeriodEnd) throw ApiError.conflict("No pending period-end cancellation");
  if (sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() > Date.now()) {
    throw ApiError.conflict("Current billing period has not ended yet");
  }
  return transition(tenantId, "CANCELLED", actor, { cancelledAt: new Date(), cancelAtPeriodEnd: false }, "subscription.cancel_finalized");
}

/** Irreversible termination (only via authorized admin/closure workflow). */
export async function terminate(tenantId: string, actor: { userId: string }) {
  return transition(tenantId, "TERMINATED", actor, { cancelledAt: new Date() }, "subscription.terminate");
}

/** Expire a trial whose end date has passed. Idempotent-safe by state check. */
export async function expireTrial(tenantId: string, actor: { userId: string }) {
  const sub = await getSubscription(tenantId);
  if (sub.status !== "TRIALING") throw ApiError.conflict("Subscription is not trialing");
  if (sub.trialEndsAt && sub.trialEndsAt.getTime() > Date.now()) {
    throw ApiError.conflict("Trial period has not ended yet");
  }
  return transition(tenantId, "EXPIRED", actor, {}, "subscription.trial_expired");
}

// ---------------------------------------------------------------------------
// Plan changes
// ---------------------------------------------------------------------------

/**
 * Upgrade/downgrade plan and seats. Downgrades NEVER delete business data;
 * they only change entitlements. If the new seat limit is below current
 * active membership, the change is accepted but flagged so callers can
 * surface which members exceed entitlement (data stays, access gated).
 */
export async function changePlan(
  tenantId: string,
  input: { plan: SubscriptionPlan; seats?: number },
  actor: { userId: string },
) {
  const plan = await prisma.planDefinition.findUnique({ where: { code: input.plan } });
  if (!plan || !plan.isActive) throw ApiError.validation("Target plan is not available");
  const sub = await getSubscription(tenantId);
  if (sub.status === "TERMINATED") throw ApiError.conflict("Cannot change plan on a terminated subscription");

  const seats = input.seats ?? sub.seats;
  if (seats < 1) throw ApiError.validation("Seat count must be at least 1");

  const activeMembers = await prisma.membership.count({ where: { tenantId, isActive: true } });
  const exceedsSeats = plan.maxSeats !== null && activeMembers > plan.maxSeats;

  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: { plan: input.plan, seats, billingPeriod: plan.billingPeriod },
  });
  await recordAuditEvent({
    tenantId,
    userId: actor.userId,
    action: "subscription.plan_change",
    entityType: "Subscription",
    entityId: sub.id,
    severity: "WARNING",
    summary: `Plan changed ${sub.plan} -> ${input.plan}, seats=${seats}`,
    metadata: { previousPlan: sub.plan, previousSeats: sub.seats, exceedsSeats },
  });
  return { subscription: updated, exceedsSeats };
}

// ---------------------------------------------------------------------------
// Entitlement evaluation
// ---------------------------------------------------------------------------

export interface EntitlementEvaluation {
  allowed: boolean;
  reason: "OK" | "SUBSCRIPTION_INACTIVE" | "MODULE_NOT_INCLUDED" | "SEAT_LIMIT_REACHED" | "API_LIMIT_REACHED" | "AI_LIMIT_REACHED" | "NO_SUBSCRIPTION";
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus | null;
  /** Remaining API calls today for the day window (null = unlimited). */
  apiRemaining: number | null;
  aiRemaining: number | null;
}

const ACCESSIBLE_STATUSES: SubscriptionStatus[] = ["ACTIVE", "TRIALING", "PENDING_ACTIVATION"];

/**
 * Central entitlement gate. Checks (in order): subscription status, module
 * inclusion in the plan, usage limits. Callers must still perform their own
 * RBAC permission checks — this function answers "is the ORGANIZATION
 * entitled", never "is this USER permitted".
 */
export async function evaluateEntitlement(
  tenantId: string,
  options: { module?: string; kind?: "api" | "ai" } = {},
): Promise<EntitlementEvaluation> {
  const sub = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!sub) {
    return { allowed: false, reason: "NO_SUBSCRIPTION", plan: null, status: null, apiRemaining: null, aiRemaining: null };
  }
  // Restricted/suspended/past-due organizations keep their data but lose
  // access to metered premium operations; ACTIVE/TRIALING/PENDING pass.
  const accessible = ACCESSIBLE_STATUSES.includes(sub.status);
  const plan = await prisma.planDefinition.findUnique({ where: { code: sub.plan } });

  let apiRemaining: number | null = null;
  let aiRemaining: number | null = null;
  if (plan) {
    const dayWindow = new Date().toISOString().slice(0, 10);
    if (plan.apiLimitPerDay !== null) {
      const used = await prisma.usageRecord.findUnique({
        where: { tenantId_metric_window: { tenantId, metric: "API_REQUESTS", window: dayWindow } },
      });
      apiRemaining = Math.max(0, plan.apiLimitPerDay - Number(used?.value ?? 0n));
    }
    if (plan.aiLimitPerDay !== null) {
      const used = await prisma.usageRecord.findUnique({
        where: { tenantId_metric_window: { tenantId, metric: "AI_INFERENCES", window: dayWindow } },
      });
      aiRemaining = Math.max(0, plan.aiLimitPerDay - Number(used?.value ?? 0n));
    }
  }

  if (!accessible) return { allowed: false, reason: "SUBSCRIPTION_INACTIVE", plan: sub.plan, status: sub.status, apiRemaining, aiRemaining };
  if (options.module && plan && plan.includedModules.length > 0 && !plan.includedModules.includes(options.module)) {
    return { allowed: false, reason: "MODULE_NOT_INCLUDED", plan: sub.plan, status: sub.status, apiRemaining, aiRemaining };
  }
  if (options.kind === "api" && apiRemaining !== null && apiRemaining <= 0) {
    return { allowed: false, reason: "API_LIMIT_REACHED", plan: sub.plan, status: sub.status, apiRemaining, aiRemaining };
  }
  if (options.kind === "ai" && aiRemaining !== null && aiRemaining <= 0) {
    return { allowed: false, reason: "AI_LIMIT_REACHED", plan: sub.plan, status: sub.status, apiRemaining, aiRemaining };
  }
  return { allowed: true, reason: "OK", plan: sub.plan, status: sub.status, apiRemaining, aiRemaining };
}

/** Throw a stable 402-style conflict error when the org is not entitled. */
export async function assertEntitled(tenantId: string, options: { module?: string; kind?: "api" | "ai" } = {}): Promise<void> {
  const result = await evaluateEntitlement(tenantId, options);
  if (!result.allowed) {
    throw new ApiError(403, "forbidden", `Organization not entitled: ${result.reason}`);
  }
}
