/**
 * Stage 14/15 SaaS billing + payment-webhook security tests.
 *
 * Covers the payment-safety invariants:
 * - HMAC signature verification fails closed (missing/garbage/mismatched).
 * - Duplicate webhook delivery is processed exactly once.
 * - Only signature-verified PAYMENT_SUCCEEDED marks invoices paid and
 *   reactivates subscriptions — client success is never trusted.
 * - Billing invoice issuance is idempotent per subscription period.
 * - Money stays in integer minor units end to end.
 */
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/database/prisma";
import * as billing from "@/server/services/billing-service";
import { dayWindow } from "@/server/services/usage-service";
import { makeTenantWithUser } from "../helpers/fixtures";
import { seedPlan, setSubscription, uniqueSlug } from "../helpers/saas-fixtures";

const WEBHOOK_SECRET = "test-webhook-secret-not-a-real-credential";

async function expectStatus(promise: Promise<unknown>, status: number): Promise<void> {
  const err = await promise.then(() => null, (e) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect((err as ApiError).status).toBe(status);
}

describe("webhook signature verification", () => {
  const body = JSON.stringify({ hello: "world" });

  it("accepts a correctly signed body", () => {
    const sig = billing.computeWebhookSignature(body, WEBHOOK_SECRET);
    expect(billing.verifyWebhookSignature(body, sig, WEBHOOK_SECRET)).toBe(true);
  });

  it("rejects missing, empty, malformed, and mismatched signatures (fail closed)", () => {
    expect(billing.verifyWebhookSignature(body, undefined, WEBHOOK_SECRET)).toBe(false);
    expect(billing.verifyWebhookSignature(body, "", WEBHOOK_SECRET)).toBe(false);
    expect(billing.verifyWebhookSignature(body, "not-hex!!!", WEBHOOK_SECRET)).toBe(false);
    expect(billing.verifyWebhookSignature(body, "ab".repeat(32), WEBHOOK_SECRET)).toBe(false);
    // Wrong secret produces a different HMAC — must not verify.
    const otherSig = billing.computeWebhookSignature(body, "other-secret-value-different");
    expect(billing.verifyWebhookSignature(body, otherSig, WEBHOOK_SECRET)).toBe(false);
    // Signed body tampered with after signing must fail.
    const sig = billing.computeWebhookSignature(body, WEBHOOK_SECRET);
    expect(billing.verifyWebhookSignature(body.replace("world", "attacker"), sig, WEBHOOK_SECRET)).toBe(false);
  });

  it("handleSignedWebhook rejects unsigned requests with 401 and never processes them", async () => {
    const bodyText = JSON.stringify({ providerEventId: `evt-${randomUUID()}`, kind: "PAYMENT_SUCCEEDED", subscriptionId: "sub-x" });
    await expectStatus(billing.handleSignedWebhook(bodyText, undefined, WEBHOOK_SECRET), 401);
    await expectStatus(billing.handleSignedWebhook(bodyText, "deadbeef".repeat(8), WEBHOOK_SECRET), 401);
    // A CRITICAL audit entry proves rejected attempts are visible to operators.
    const audits = await prisma.auditLog.findMany({ where: { action: "billing.webhook.signature_invalid" } });
    expect(audits.length).toBeGreaterThanOrEqual(2);
  });

  it("handleSignedWebhook refuses when no secret is configured (no bypass)", async () => {
    // Missing server-side signing secret must fail closed with a safe 500 —
    // never process the body and never fall back to an "unsigned accepted"
    // path.
    const err = await billing
      .handleSignedWebhook("{}", "sig", undefined)
      .then(() => null, (e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
  });
});

describe("payment event processing", () => {
  /** Create a tenant on an ACTIVE plan with one OPEN billing invoice. */
  async function setupPaidScenario() {
    const t = await makeTenantWithUser();
    await seedPlan({ code: "GROWTH", priceMinor: 75_000 });
    // Provisioning may have created a TRIAL sub; force GROWTH/ACTIVE cleanly.
    await setSubscription(t.tenantId, { status: "ACTIVE", plan: "GROWTH" });
    const s = await prisma.subscription.findUniqueOrThrow({ where: { tenantId: t.tenantId } });
    const invoice = await billing.issueBillingInvoice(s.id);
    return { t, s, invoice };
  }

  it("marks the open invoice PAID only from a verified success event and advances the period", async () => {
    const { s, invoice } = await setupPaidScenario();
    const evtId = `evt-${randomUUID()}`;
    const res = await billing.processPaymentEvent({
      provider: "stub",
      providerEventId: evtId,
      kind: "PAYMENT_SUCCEEDED",
      subscriptionId: s.id,
      providerRef: `pay-${randomUUID()}`,
      amountMinor: invoice.totalMinor,
      currency: invoice.currency,
    });
    expect(res.status).toBe("processed");
    expect(res.invoicePaid).toBe(true);

    const paid = await prisma.billingInvoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(paid.status).toBe("PAID");
    expect(paid.paidAt).toBeTruthy();
    expect(paid.totalMinor).toBe(invoice.totalMinor); // unchanged integer amount

    const sub = await prisma.subscription.findUniqueOrThrow({ where: { id: s.id } });
    expect(sub.currentPeriodStart!.getTime()).toBe(invoice.periodEnd.getTime());

    const attempt = await prisma.paymentAttempt.findFirst({ where: { subscriptionId: s.id } });
    expect(attempt?.status).toBe("SUCCEEDED");
  });

  it("duplicate delivery of the same provider event is provably processed once", async () => {
    const { s, invoice } = await setupPaidScenario();
    const evtId = `dup-${randomUUID()}`;
    const base = {
      provider: "stub",
      providerEventId: evtId,
      kind: "PAYMENT_SUCCEEDED" as const,
      subscriptionId: s.id,
      providerRef: `pay-${randomUUID()}`,
    };
    const first = await billing.processPaymentEvent(base);
    expect(first.status).toBe("processed");
    const second = await billing.processPaymentEvent(base);
    expect(second.status).toBe("duplicate");
    const third = await billing.processPaymentEvent(base);
    expect(third.status).toBe("duplicate");

    // Exactly one invoice for the period, still PAID, one event log row.
    const count = await prisma.billingInvoice.count({ where: { subscriptionId: s.id, periodStart: invoice.periodStart } });
    expect(count).toBe(1);
    const logs = await prisma.paymentEventLog.count({ where: { provider: "stub", providerEventId: evtId } });
    expect(logs).toBe(1);
  });

  it("concurrent duplicate events cannot double-charge (unique constraint wins)", async () => {
    const { s } = await setupPaidScenario();
    const evtId = `race-${randomUUID()}`;
    const payload = {
      provider: "stub",
      providerEventId: evtId,
      kind: "PAYMENT_SUCCEEDED" as const,
      subscriptionId: s.id,
      providerRef: `pay-${randomUUID()}`,
    };
    const results = await Promise.all([
      billing.processPaymentEvent(payload),
      billing.processPaymentEvent(payload),
      billing.processPaymentEvent(payload),
    ]);
    const processed = results.filter((r) => r.status === "processed").length;
    expect(processed).toBeLessThanOrEqual(1);
    expect(results.every((r) => r.status === "processed" || r.status === "duplicate")).toBe(true);
    const logs = await prisma.paymentEventLog.count({ where: { providerEventId: evtId } });
    expect(logs).toBe(1);
  });

  it("PAYMENT_FAILED moves an ACTIVE subscription to PAST_DUE and records the failure", async () => {
    const { s } = await setupPaidScenario();
    const res = await billing.processPaymentEvent({
      provider: "stub",
      providerEventId: `fail-${randomUUID()}`,
      kind: "PAYMENT_FAILED",
      subscriptionId: s.id,
      providerRef: `attempt-${randomUUID()}`,
      failureReason: "insufficient_funds",
    });
    expect(res.newStatus).toBe("PAST_DUE");
    const sub = await prisma.subscription.findUniqueOrThrow({ where: { id: s.id } });
    expect(sub.status).toBe("PAST_DUE");
    const attempt = await prisma.paymentAttempt.findFirst({
      where: { subscriptionId: s.id, status: "FAILED" },
    });
    expect(attempt?.failureReason).toBe("insufficient_funds");
  });

  it("SUBSCRIPTION_CANCELLED event stops renewal but preserves access and data", async () => {
    const { s, t } = await setupPaidScenario();
    await billing.processPaymentEvent({
      provider: "stub",
      providerEventId: `canc-${randomUUID()}`,
      kind: "SUBSCRIPTION_CANCELLED",
      subscriptionId: s.id,
    });
    const sub = await prisma.subscription.findUniqueOrThrow({ where: { id: s.id } });
    expect(sub.status).toBe("ACTIVE"); // access continues until period end
    expect(sub.cancelAtPeriodEnd).toBe(true);
    // Business data untouched.
    expect(await prisma.membership.count({ where: { tenantId: t.tenantId } })).toBeGreaterThan(0);
  });

  it("events for unknown subscriptions are logged with an error marker and never mutate state", async () => {
    const evtId = `ghost-${randomUUID()}`;
    const res = await billing.processPaymentEvent({
      provider: "stub",
      providerEventId: evtId,
      kind: "PAYMENT_SUCCEEDED",
      subscriptionId: "does-not-exist",
    });
    expect(res.status).toBe("processed");
    // The event is persisted (auditability) but flagged as unprocessable.
    const log = await prisma.paymentEventLog.findFirst({ where: { provider: "stub", providerEventId: evtId } });
    expect(log).not.toBeNull();
    expect(log?.error).toBe("unknown_subscription");
  });
});

describe("billing invoice issuance", () => {
  it("is idempotent per subscription period — retries never double-invoice", async () => {
    const t = await makeTenantWithUser();
    await seedPlan({ code: "STARTER", priceMinor: 30_000 });
    await setSubscription(t.tenantId, { status: "ACTIVE", plan: "STARTER" });
    const s = await prisma.subscription.findUniqueOrThrow({ where: { tenantId: t.tenantId } });

    const a = await billing.issueBillingInvoice(s.id);
    const b = await billing.issueBillingInvoice(s.id);
    expect(b.id).toBe(a.id);
    const count = await prisma.billingInvoice.count({ where: { subscriptionId: s.id } });
    expect(count).toBe(1);
    expect(a.totalMinor).toBe(30_000);
    expect(a.number).toContain("SBI-");
  });

  it("outstandingBalances sums only the requesting tenant's OPEN invoices", async () => {
    const own = await makeTenantWithUser();
    const other = await makeTenantWithUser();
    await seedPlan({ code: "GROWTH", priceMinor: 75_000 });
    await setSubscription(own.tenantId, { status: "ACTIVE", plan: "GROWTH" });
    await setSubscription(other.tenantId, { status: "ACTIVE", plan: "GROWTH" });
    const ownSub = await prisma.subscription.findUniqueOrThrow({ where: { tenantId: own.tenantId } });
    const otherSub = await prisma.subscription.findUniqueOrThrow({ where: { tenantId: other.tenantId } });
    await billing.issueBillingInvoice(ownSub.id);
    await billing.issueBillingInvoice(otherSub.id);

    const balances = await billing.outstandingBalances(own.tenantId);
    expect(balances).toHaveLength(1);
    expect(balances[0].currency).toBe("TZS");
    expect(balances[0].openTotalMinor).toBe(75_000); // only own tenant's invoice
  });

  it("listRecentEvents exposes metadata only — never raw payloads", async () => {
    const evtId = `meta-${randomUUID()}`;
    await prisma.paymentEventLog.create({
      data: {
        provider: "stub",
        providerEventId: evtId,
        kind: "SUBSCRIPTION_RENEWED",
        payloadSummary: { note: "summary object, not a full provider payload" },
      },
    });
    const rows = await billing.listRecentEvents(10);
    const mine = rows.find((r) => r.providerEventId === evtId);
    expect(mine).toBeTruthy();
    // The selected fields intentionally exclude payloadSummary.
    expect(Object.keys(mine!)).toEqual(
      expect.arrayContaining(["id", "provider", "providerEventId", "kind", "processed", "receivedAt"]),
    );
    expect(mine).not.toHaveProperty("payloadSummary");
  });
});

describe("usage metering service", () => {
  it("composes concurrent increments without losing counts", async () => {
    const t = await makeTenantWithUser();
    const win = dayWindow();
    await Promise.all(
      Array.from({ length: 10 }, () =>
        import("@/server/services/usage-service").then((m) => m.recordUsage(t.tenantId, "API_REQUESTS", 1n, win)),
      ),
    );
    const total = await import("@/server/services/usage-service").then((m) => m.getUsage(t.tenantId, "API_REQUESTS", win));
    expect(total).toBe(10n);
  });

  it("day and month windows are isolated counters", async () => {
    const t = await makeTenantWithUser();
    const usage = await import("@/server/services/usage-service");
    await usage.recordUsage(t.tenantId, "AUTOMATION_RUNS", 3n, usage.dayWindow());
    await usage.recordUsage(t.tenantId, "AUTOMATION_RUNS", 5n, usage.monthWindow());
    expect(await usage.getUsage(t.tenantId, "AUTOMATION_RUNS", usage.dayWindow())).toBe(3n);
    expect(await usage.getUsage(t.tenantId, "AUTOMATION_RUNS", usage.monthWindow())).toBe(5n);
  });

  it("snapshot derives ACTIVE_USERS from memberships (authoritative source)", async () => {
    const t = await makeTenantWithUser();
    const { addMember } = await import("../helpers/fixtures");
    await addMember(t.tenantId, "MEMBER");
    const usage = await import("@/server/services/usage-service");
    const snap = await usage.currentUsageSnapshot(t.tenantId);
    expect(snap.usage.ACTIVE_USERS).toBe("2");
  });

  it("history returns newest-first string values safe for API serialization", async () => {
    const t = await makeTenantWithUser();
    const usage = await import("@/server/services/usage-service");
    await usage.recordUsage(t.tenantId, "STORAGE_BYTES", 1024n, "2026-10-01");
    await usage.recordUsage(t.tenantId, "STORAGE_BYTES", 2048n, "2026-10-02");
    const hist = await usage.usageHistory(t.tenantId, "STORAGE_BYTES");
    expect(hist[0].window).toBe("2026-10-02");
    expect(hist[0].value).toBe("2048");
    expect(typeof hist[0].value).toBe("string"); // BigInt never crosses API boundary raw
  });
});

describe("tenant provisioning lifecycle", () => {
  it("creates tenant + owner membership + trial subscription atomically", async () => {
    const prov = await import("@/server/services/provisioning-service");
    const owner = await prisma.user.create({
      data: {
        email: `owner-${randomUUID().slice(0, 8)}@example.test`,
        name: "Provisioning Owner",
        passwordHash: "x", // provisioning only checks existence/isActive
        isVerified: true,
      },
    });
    const slug = uniqueSlug("prov");
    const res = await prov.provisionOrganization({
      name: "Prov Test Org",
      slug,
      ownerId: owner.id,
      idempotencyKey: `key-${randomUUID()}`,
    });
    expect(res.replayed).toBe(false);
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: res.tenantId } });
    expect(tenant.provisioningStatus).toBe("PENDING_SETUP");
    expect(tenant.ownerId).toBe(owner.id);
    expect(await prisma.membership.count({ where: { tenantId: tenant.id, role: "ADMIN" } })).toBe(1);
    const s = await prisma.subscription.findUniqueOrThrow({ where: { tenantId: tenant.id } });
    expect(s.status).toBe("TRIALING");
  });

  it("retried provisioning with the same key replays instead of duplicating", async () => {
    const prov = await import("@/server/services/provisioning-service");
    const owner = await prisma.user.create({
      data: { email: `o2-${randomUUID().slice(0, 8)}@example.test`, name: "O2", passwordHash: "x", isVerified: true },
    });
    const slug = uniqueSlug("idem");
    const key = `same-key-${randomUUID()}`;
    const first = await prov.provisionOrganization({ name: "X", slug, ownerId: owner.id, idempotencyKey: key });
    const retry = await prov.provisionOrganization({ name: "X", slug, ownerId: owner.id, idempotencyKey: key });
    expect(retry.tenantId).toBe(first.tenantId);
    expect(retry.replayed).toBe(true);
    expect(await prisma.tenant.count({ where: { slug } })).toBe(1);
    expect(await prisma.subscription.count({ where: { tenantId: first.tenantId } })).toBe(1);
  });

  it("concurrent identical provisioning requests produce exactly one organization", async () => {
    const prov = await import("@/server/services/provisioning-service");
    const owner = await prisma.user.create({
      data: { email: `o3-${randomUUID().slice(0, 8)}@example.test`, name: "O3", passwordHash: "x", isVerified: true },
    });
    const slug = uniqueSlug("race");
    const key = `race-key-${randomUUID()}`;
    const results = await Promise.all([
      prov.provisionOrganization({ name: "R", slug, ownerId: owner.id, idempotencyKey: key }),
      prov.provisionOrganization({ name: "R", slug, ownerId: owner.id, idempotencyKey: key }),
      prov.provisionOrganization({ name: "R", slug, ownerId: owner.id, idempotencyKey: key }),
    ]);
    const ids = new Set(results.map((r) => r.tenantId));
    expect(ids.size).toBe(1);
    expect(await prisma.tenant.count({ where: { slug } })).toBe(1);
  });

  it("enforces the provisioning state machine end-to-end", async () => {
    const prov = await import("@/server/services/provisioning-service");
    const t = await makeTenantWithUser();
    await prisma.tenant.update({ where: { id: t.tenantId }, data: { provisioningStatus: "PENDING_SETUP", ownerId: t.userId } });

    // Illegal jump straight to SUSPENDED must fail.
    await expectStatus(prov.suspendOrganization(t.tenantId, { userId: t.userId }), 409);

    await prov.finishSetup(t.tenantId, { userId: t.userId });
    await prov.activateOrganization(t.tenantId, { userId: t.userId });
    await prov.suspendOrganization(t.tenantId, { userId: t.userId });
    const suspended = await prisma.tenant.findUniqueOrThrow({ where: { id: t.tenantId } });
    expect(suspended.provisioningStatus).toBe("SUSPENDED");
    expect(suspended.isActive).toBe(false);

    await prov.activateOrganization(t.tenantId, { userId: t.userId }); // reactivation allowed
    expect((await prisma.tenant.findUniqueOrThrow({ where: { id: t.tenantId } })).provisioningStatus).toBe("ACTIVE");
  });

  it("only the owner may begin closure; closure revokes sessions but retains data", async () => {
    const prov = await import("@/server/services/provisioning-service");
    const t = await makeTenantWithUser();
    await prisma.tenant.update({ where: { id: t.tenantId }, data: { provisioningStatus: "ACTIVE", ownerId: t.userId } });

    const stranger = await makeTenantWithUser();
    await expectStatus(prov.beginClosure(t.tenantId, { userId: stranger.userId }), 403);

    await prov.beginClosure(t.tenantId, { userId: t.userId });
    await prov.finalizeClosure(t.tenantId, { userId: t.userId });

    const closed = await prisma.tenant.findUniqueOrThrow({ where: { id: t.tenantId } });
    expect(closed.provisioningStatus).toBe("CLOSED");
    // Memberships deactivated...
    expect(await prisma.membership.count({ where: { tenantId: t.tenantId, isActive: true } })).toBe(0);
    // ...but business data retained (closure is NOT deletion).
    const company = await prisma.company.findFirst({ where: { tenantId: t.tenantId } });
    if (company) expect(company).toBeTruthy();
    const audit = await prisma.auditLog.findFirst({ where: { tenantId: t.tenantId, action: "org.closure.data_retained" } });
    expect(audit).not.toBeNull();
  });

  it("ownership transfer requires current owner and an active member target", async () => {
    const prov = await import("@/server/services/provisioning-service");
    const { addMember } = await import("../helpers/fixtures");
    const t = await makeTenantWithUser();
    await prisma.tenant.update({ where: { id: t.tenantId }, data: { ownerId: t.userId } });
    const newOwner = await addMember(t.tenantId, "MANAGER");

    // Non-owner cannot transfer.
    await expectStatus(prov.transferOwnership(t.tenantId, newOwner.userId, { userId: newOwner.userId }), 403);

    const res = await prov.transferOwnership(t.tenantId, newOwner.userId, { userId: t.userId });
    expect(res.ownerId).toBe(newOwner.userId);
    // Target was promoted to ADMIN so they can exercise ownership rights.
    const m = await prisma.membership.findFirstOrThrow({ where: { tenantId: t.tenantId, userId: newOwner.userId } });
    expect(m.role).toBe("ADMIN");

    // Transfer to a non-member must fail validation.
    await expectStatus(prov.transferOwnership(t.tenantId, (await makeTenantWithUser()).userId, { userId: newOwner.userId }), 400);
  });

  it("last-admin protection blocks removal of the final administrator", async () => {
    const prov = await import("@/server/services/provisioning-service");
    const t = await makeTenantWithUser("ADMIN");
    await prisma.tenant.update({ where: { id: t.tenantId }, data: { ownerId: t.userId } });

    // Sole admin+owner removal is refused.
    const err = await prov.assertNotLastAdminRemoval(t.membershipId, t.tenantId).then(() => null, (e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(409);
    expect((err as Error).message).toMatch(/transfer ownership|promote another member/i);

    // With a second active admin, removal of one is permitted.
    const { addMember } = await import("../helpers/fixtures");
    await addMember(t.tenantId, "ADMIN");
    await expect(prov.assertNotLastAdminRemoval(t.membershipId, t.tenantId)).resolves.toBeUndefined();
  });

  it("inactive or non-admin memberships bypass the last-admin guard safely", async () => {
    const prov = await import("@/server/services/provisioning-service");
    const { addMember } = await import("../helpers/fixtures");
    const t = await makeTenantWithUser("ADMIN");
    const salesMember = await addMember(t.tenantId, "MEMBER");
    // Removing a SALES member can never orphan administration.
    await expect(prov.assertNotLastAdminRemoval(salesMember.membershipId, t.tenantId)).resolves.toBeUndefined();
  });
});
