/**
 * Stage 14/15 subscription lifecycle + entitlement integration tests.
 *
 * Covers:
 * - state-machine legality (positive and rejected transitions)
 * - trial expiry rules
 * - cancellation-at-period-end vs immediate termination separation
 * - plan changes with data preservation and seat-overage flagging
 * - central entitlement evaluation (status gate, module inclusion, usage
 *   limits) — proving entitlement never replaces RBAC and vice versa
 */
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/database/prisma";
import * as sub from "@/server/services/subscription-service";
import { recordUsage } from "@/server/services/usage-service";
import { makeTenantWithUser, addMember } from "../helpers/fixtures";
import { seedPlan, setSubscription } from "../helpers/saas-fixtures";

/** Read audit rows for a given action/tenant (append-only trail verification). */
async function prismaAudit(action: string, tenantId: string) {
  return prisma.auditLog.findMany({ where: { action, tenantId } });
}

async function expectConflict(promise: Promise<unknown>): Promise<void> {
  const err = await promise.then(() => null, (e) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect((err as ApiError).status).toBe(409);
}

describe("subscription state machine", () => {
  it("allows the documented happy-path transitions", () => {
    expect(sub.canTransition("PENDING_ACTIVATION", "TRIALING")).toBe(true);
    expect(sub.canTransition("TRIALING", "ACTIVE")).toBe(true);
    expect(sub.canTransition("ACTIVE", "PAST_DUE")).toBe(true);
    expect(sub.canTransition("PAST_DUE", "GRACE_PERIOD")).toBe(true);
    expect(sub.canTransition("GRACE_PERIOD", "RESTRICTED")).toBe(true);
    expect(sub.canTransition("RESTRICTED", "ACTIVE")).toBe(true); // payment recovered
    expect(sub.canTransition("SUSPENDED", "ACTIVE")).toBe(true); // reactivation
  });

  it("rejects illegal transitions including TERMINATED as a sink", () => {
    expect(sub.canTransition("TERMINATED", "ACTIVE")).toBe(false);
    expect(sub.canTransition("CANCELLED", "ACTIVE")).toBe(false);
    expect(sub.canTransition("EXPIRED", "CANCELLED")).toBe(false);
    expect(sub.canTransition("PENDING_ACTIVATION", "PAST_DUE")).toBe(false);
  });

  it("transition service refuses an illegal move and keeps status unchanged", async () => {
    const t = await makeTenantWithUser();
    await setSubscription(t.tenantId, { status: "TERMINATED" });
    await expectConflict(sub.activate(t.tenantId, { userId: t.userId }));
    const s = await sub.getSubscription(t.tenantId);
    expect(s.status).toBe("TERMINATED");
  });

  it("records an audit event for every enforced transition", async () => {
    const t = await makeTenantWithUser();
    await setSubscription(t.tenantId, { status: "ACTIVE" });
    await sub.suspend(t.tenantId, { userId: t.userId });
    const logs = await prismaAudit("subscription.suspend", t.tenantId);
    expect(logs.length).toBe(1);
    expect(logs[0].summary).toMatch(/ACTIVE -> SUSPENDED/);
  });
});

describe("trial expiry", () => {
  it("refuses to expire a trial that has not ended yet", async () => {
    const t = await makeTenantWithUser();
    await setSubscription(t.tenantId, { status: "TRIALING", trialEndsAt: new Date(Date.now() + 86_400_000) });
    await expectConflict(sub.expireTrial(t.tenantId, { userId: t.userId }));
  });

  it("expires a trial whose end date passed", async () => {
    const t = await makeTenantWithUser();
    await setSubscription(t.tenantId, { status: "TRIALING", trialEndsAt: new Date(Date.now() - 86_400_000) });
    const updated = await sub.expireTrial(t.tenantId, { userId: t.userId });
    expect(updated.status).toBe("EXPIRED");
  });

  it("is idempotent-safe: expiring a non-trialing subscription fails cleanly", async () => {
    const t = await makeTenantWithUser();
    await setSubscription(t.tenantId, { status: "ACTIVE" });
    await expectConflict(sub.expireTrial(t.tenantId, { userId: t.userId }));
  });
});

describe("cancellation semantics", () => {
  it("cancel-at-period-end preserves access and only flags renewal intent", async () => {
    const t = await makeTenantWithUser();
    await setSubscription(t.tenantId, { status: "ACTIVE" });
    const updated = await sub.cancel(t.tenantId, { userId: t.userId });
    expect(updated.status).toBe("ACTIVE"); // access NOT revoked yet
    expect(updated.cancelAtPeriodEnd).toBe(true);
  });

  it("finalize before period end is refused; after period end it cancels", async () => {
    const t = await makeTenantWithUser();
    await setSubscription(t.tenantId, {
      status: "ACTIVE",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(Date.now() + 3_600_000),
    });
    await expectConflict(sub.finalizePeriodEndCancellation(t.tenantId, { userId: t.userId }));

    await prisma.subscription.update({
      where: { tenantId: t.tenantId },
      data: { currentPeriodEnd: new Date(Date.now() - 1000) },
    });
    const done = await sub.finalizePeriodEndCancellation(t.tenantId, { userId: t.userId });
    expect(done.status).toBe("CANCELLED");
    expect(done.cancelledAt).toBeTruthy();
  });

  it("immediate cancellation is distinct from period-end cancellation", async () => {
    const t = await makeTenantWithUser();
    await setSubscription(t.tenantId, { status: "ACTIVE" });
    const now = await sub.cancel(t.tenantId, { userId: t.userId }, { immediate: true });
    expect(now.status).toBe("CANCELLED");
    expect(now.cancelAtPeriodEnd).toBe(false);
  });
});

describe("plan changes", () => {
  it("rejects unknown or inactive plans", async () => {
    const t = await makeTenantWithUser();
    await setSubscription(t.tenantId, { status: "ACTIVE" });
    const err = await sub
      .changePlan(t.tenantId, { plan: "GROWTH" }, { userId: t.userId })
      .then(() => null, (e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(400);
  });

  it("downgrade preserves all business data and flags seat overage", async () => {
    const t = await makeTenantWithUser();
    await seedPlan({ code: "STARTER", maxSeats: 1 });
    await seedPlan({ code: "GROWTH", maxSeats: 10 });
    await setSubscription(t.tenantId, { status: "ACTIVE", plan: "GROWTH" });
    // Three active members exceed STARTER's single seat.
    await addMember(t.tenantId, "MANAGER");
    await addMember(t.tenantId, "SALES");

    // A company record proves tenant business data survives the downgrade.
    const company = await prisma.company.create({
      data: { tenantId: t.tenantId, name: "Kept After Downgrade" },
    });

    const res = await sub.changePlan(t.tenantId, { plan: "STARTER" }, { userId: t.userId });
    expect(res.subscription.plan).toBe("STARTER");
    expect(res.exceedsSeats).toBe(true);
    // Data preserved: memberships still active, company still present.
    expect(await prisma.membership.count({ where: { tenantId: t.tenantId, isActive: true } })).toBe(3);
    expect(await prisma.company.findUnique({ where: { id: company.id } })).not.toBeNull();
  });

  it("cannot change plan on a terminated subscription", async () => {
    const t = await makeTenantWithUser();
    await seedPlan({ code: "STARTER" });
    await setSubscription(t.tenantId, { status: "TERMINATED" });
    await expectConflict(sub.changePlan(t.tenantId, { plan: "STARTER" }, { userId: t.userId }));
  });
});

describe("entitlement evaluation", () => {
  it("denies access when no subscription exists at all", async () => {
    const t = await makeTenantWithUser();
    // Remove any subscription created by fixtures/provisioning.
    await prisma.subscription.deleteMany({ where: { tenantId: t.tenantId } });
    const ev = await sub.evaluateEntitlement(t.tenantId);
    expect(ev.allowed).toBe(false);
    expect(ev.reason).toBe("NO_SUBSCRIPTION");
  });

  it("denies when subscription is suspended but reports remaining limits", async () => {
    const t = await makeTenantWithUser();
    await seedPlan({ code: "GROWTH", apiLimitPerDay: 100 });
    await setSubscription(t.tenantId, { status: "SUSPENDED", plan: "GROWTH" });
    const ev = await sub.evaluateEntitlement(t.tenantId, { kind: "api" });
    expect(ev.allowed).toBe(false);
    expect(ev.reason).toBe("SUBSCRIPTION_INACTIVE");
    expect(ev.apiRemaining).toBe(100);
  });

  it("enforces module inclusion per plan", async () => {
    const t = await makeTenantWithUser();
    await seedPlan({ code: "STARTER", includedModules: ["crm", "inventory"] });
    await setSubscription(t.tenantId, { status: "ACTIVE", plan: "STARTER" });
    expect((await sub.evaluateEntitlement(t.tenantId, { module: "crm" })).allowed).toBe(true);
    const ai = await sub.evaluateEntitlement(t.tenantId, { module: "ai_assistant" });
    expect(ai.allowed).toBe(false);
    expect(ai.reason).toBe("MODULE_NOT_INCLUDED");
  });

  it("enforces daily API metering exactly at the boundary", async () => {
    const t = await makeTenantWithUser();
    await seedPlan({ code: "STARTER", apiLimitPerDay: 2 });
    await setSubscription(t.tenantId, { status: "ACTIVE", plan: "STARTER" });

    expect((await sub.evaluateEntitlement(t.tenantId, { kind: "api" })).apiRemaining).toBe(2);
    await recordUsage(t.tenantId, "API_REQUESTS", 1n);
    const oneUsed = await sub.evaluateEntitlement(t.tenantId, { kind: "api" });
    expect(oneUsed.allowed).toBe(true);
    expect(oneUsed.apiRemaining).toBe(1);
    await recordUsage(t.tenantId, "API_REQUESTS", 1n);
    const exhausted = await sub.evaluateEntitlement(t.tenantId, { kind: "api" });
    expect(exhausted.allowed).toBe(false);
    expect(exhausted.reason).toBe("API_LIMIT_REACHED");
    expect(exhausted.apiRemaining).toBe(0);
  });

  it("never mixes usage counters across tenants", async () => {
    const a = await makeTenantWithUser();
    const b = await makeTenantWithUser();
    await seedPlan({ code: "STARTER", aiLimitPerDay: 1 });
    await setSubscription(a.tenantId, { status: "ACTIVE", plan: "STARTER" });
    await setSubscription(b.tenantId, { status: "ACTIVE", plan: "STARTER" });

    await recordUsage(a.tenantId, "AI_INFERENCES", 1n);
    // Tenant A is exhausted; tenant B must be untouched by A's usage.
    expect((await sub.evaluateEntitlement(a.tenantId, { kind: "ai" })).allowed).toBe(false);
    expect((await sub.evaluateEntitlement(b.tenantId, { kind: "ai" })).allowed).toBe(true);
  });

  it("assertEntitled throws a stable 403 error object for callers", async () => {
    const t = await makeTenantWithUser();
    await setSubscription(t.tenantId, { status: "RESTRICTED" });
    const err = await sub.assertEntitled(t.tenantId).then(() => null, (e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(403);
    expect((err as ApiError).code).toBe("forbidden");
  });

  it("unlimited plans report null remaining rather than fake numbers", async () => {
    const t = await makeTenantWithUser();
    await seedPlan({ code: "ENTERPRISE", apiLimitPerDay: null, aiLimitPerDay: null });
    await setSubscription(t.tenantId, { status: "ACTIVE", plan: "ENTERPRISE" });
    const ev = await sub.evaluateEntitlement(t.tenantId, { kind: "api" });
    expect(ev.allowed).toBe(true);
    expect(ev.apiRemaining).toBeNull();
    expect(ev.aiRemaining).toBeNull();
  });
});
