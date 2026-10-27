import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "@/server/services/audit-service";
import { addBillingPeriod } from "@/server/services/subscription-service";
import type { PaymentEventKind } from "@prisma/client";

/**
 * SaaS billing domain (Stage 14).
 *
 * This module manages ClickIT's OWN subscription billing for tenants. It is
 * deliberately separate from the tenant-facing operational Invoice/Payment
 * records in finance-service (tenants bill their own customers there).
 *
 * Payment safety rules implemented here:
 * - No payment provider is connected (none approved). The internal boundary
 *   is provider-agnostic; a "stub" provider exists only for local testing.
 * - Webhook events must carry a valid HMAC signature over the raw body.
 * - Every event is persisted keyed by (provider, providerEventId); duplicate
 *   delivery is provably processed exactly once via the unique constraint.
 * - Client-submitted success is NEVER accepted as payment evidence. Only a
 *   signature-verified PAYMENT_SUCCEEDED event marks invoices paid and
 *   activates subscriptions.
 */

// ---------------------------------------------------------------------------
// Billing invoice generation
// ---------------------------------------------------------------------------

/**
 * Issue a billing invoice for the subscription's current period. Amounts are
 * integer minor units computed from PlanDefinition.priceMinor — no floats.
 * Idempotent per (subscription, periodStart): re-running for the same period
 * returns the existing invoice instead of double-charging.
 */
export async function issueBillingInvoice(subscriptionId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { tenant: { select: { id: true, slug: true } } },
  });
  if (!sub) throw ApiError.notFound("Subscription not found");
  const plan = await prisma.planDefinition.findUnique({ where: { code: sub.plan } });
  if (!plan) throw ApiError.validation("No plan definition for subscription plan");

  const periodStart = sub.currentPeriodStart ?? sub.startedAt;
  const periodEnd = addBillingPeriod(periodStart, plan.billingPeriod);

  // Idempotency guard: one invoice per subscription per period start.
  const existing = await prisma.billingInvoice.findFirst({
    where: { subscriptionId, periodStart },
  });
  if (existing) return existing;

  // Deterministic invoice number derived from subscription + period so
  // concurrent retries collide on the unique index rather than duplicating.
  const number = `SBI-${sub.tenant.slug}-${periodStart.toISOString().slice(0, 10)}`;
  const taxMinor = 0; // Tax rates require verified legal review — none invented.
  const invoice = await prisma.billingInvoice.create({
    data: {
      number,
      subscriptionId,
      periodStart,
      periodEnd,
      amountMinor: plan.priceMinor,
      currency: plan.currency,
      taxMinor,
      totalMinor: plan.priceMinor + taxMinor,
      status: "OPEN",
    },
  });
  await recordAuditEvent({
    tenantId: sub.tenantId,
    action: "billing.invoice.issued",
    entityType: "BillingInvoice",
    entityId: invoice.id,
    summary: `SaaS billing invoice ${number} issued (${invoice.totalMinor} ${invoice.currency} minor units)`,
  });
  return invoice;
}

// ---------------------------------------------------------------------------
// Webhook signature verification (provider-agnostic HMAC scheme)
// ---------------------------------------------------------------------------

/** Compute the expected signature for a raw webhook body. */
export function computeWebhookSignature(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

/** Constant-time signature comparison; malformed input fails closed. */
export function verifyWebhookSignature(rawBody: string, providedSignature: string | undefined, secret: string): boolean {
  if (!providedSignature || !secret) return false;
  const expected = computeWebhookSignature(rawBody, secret);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(providedSignature, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Event processing (idempotent, transactional)
// ---------------------------------------------------------------------------

export interface NormalizedPaymentEvent {
  provider: string;
  providerEventId: string;
  kind: PaymentEventKind;
  subscriptionId: string;
  /** Provider reference for the payment (attempt dedupe key). */
  providerRef?: string;
  amountMinor?: number;
  currency?: string;
  failureReason?: string;
}

type ProcessResult = { status: "processed" | "duplicate"; invoicePaid?: boolean; newStatus?: string };

/**
 * Persist + process a normalized payment event inside one transaction.
 * Duplicate (provider, providerEventId) deliveries short-circuit to
 * {status:"duplicate"} without side effects, satisfying exactly-once
 * business semantics under at-least-once delivery.
 */
export async function processPaymentEvent(event: NormalizedPaymentEvent): Promise<ProcessResult> {
  return prisma.$transaction(async (tx) => {
    // Insert-or-detect duplicate on the unique key.
    let log: { id: string; processed: boolean };
    try {
      log = await tx.paymentEventLog.create({
        data: {
          provider: event.provider,
          providerEventId: event.providerEventId,
          kind: event.kind,
          payloadSummary: { subscriptionId: event.subscriptionId, amountMinor: event.amountMinor ?? null },
        },
        select: { id: true, processed: true },
      });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === "P2002") {
        return { status: "duplicate" };
      }
      throw e;
    }

    const sub = await tx.subscription.findUnique({ where: { id: event.subscriptionId } });
    if (!sub) {
      await tx.paymentEventLog.update({ where: { id: log.id }, data: { processed: true, error: "unknown_subscription" } });
      return { status: "processed" };
    }

    switch (event.kind) {
      case "PAYMENT_SUCCEEDED": {
        // Find the open invoice for the current period; mark paid atomically.
        const invoice = await tx.billingInvoice.findFirst({
          where: { subscriptionId: sub.id, status: "OPEN" },
          orderBy: { periodStart: "desc" },
        });
        if (invoice) {
          await tx.billingInvoice.update({
            where: { id: invoice.id },
            data: { status: "PAID", paidAt: new Date(), providerRef: event.providerRef ?? null },
          });
          if (event.provider && event.providerRef) {
            // Record the confirmed attempt; unique(provider,providerRef)
            // prevents double-recording even if events replay differently.
            await tx.paymentAttempt.upsert({
              where: { provider_providerRef: { provider: event.provider, providerRef: event.providerRef } },
              create: {
                billingInvoiceId: invoice.id,
                subscriptionId: sub.id,
                status: "SUCCEEDED",
                provider: event.provider,
                providerRef: event.providerRef,
                amountMinor: event.amountMinor ?? invoice.totalMinor,
                currency: event.currency ?? invoice.currency,
                confirmedAt: new Date(),
              },
              update: { status: "SUCCEEDED", confirmedAt: new Date() },
            });
          }
          // Advance the billing period and reactivate from past-due/grace.
          const nextStart = invoice.periodEnd;
          const plan = await tx.planDefinition.findUnique({ where: { code: sub.plan } });
          const nextEnd = addBillingPeriod(nextStart, plan?.billingPeriod ?? sub.billingPeriod);
          const reactivatable = ["PAST_DUE", "GRACE_PERIOD", "RESTRICTED", "TRIALING", "PENDING_ACTIVATION"].includes(sub.status);
          await tx.subscription.update({
            where: { id: sub.id },
            data: {
              currentPeriodStart: nextStart,
              currentPeriodEnd: nextEnd,
              renewsAt: nextEnd,
              trialEndsAt: sub.trialEndsAt ?? null,
              ...(reactivatable ? { status: "ACTIVE" as const } : {}),
            },
          });
          await tx.paymentEventLog.update({ where: { id: log.id }, data: { processed: true, processedAt: new Date() } });
          await recordAuditEvent({
            tenantId: sub.tenantId,
            action: "billing.payment.succeeded",
            entityType: "BillingInvoice",
            entityId: invoice.id,
            summary: `Payment confirmed for ${invoice.number}; subscription period advanced`,
          });
          return { status: "processed", invoicePaid: true, newStatus: reactivatable ? "ACTIVE" : sub.status };
        }
        await tx.paymentEventLog.update({ where: { id: log.id }, data: { processed: true, processedAt: new Date() } });
        return { status: "processed" };
      }
      case "PAYMENT_FAILED": {
        if (["ACTIVE", "TRIALING", "GRACE_PERIOD"].includes(sub.status)) {
          await tx.subscription.update({ where: { id: sub.id }, data: { status: "PAST_DUE" } });
        }
        if (event.provider && event.providerRef) {
          await tx.paymentAttempt.upsert({
            where: { provider_providerRef: { provider: event.provider, providerRef: event.providerRef } },
            create: {
              billingInvoiceId: (await tx.billingInvoice.findFirst({ where: { subscriptionId: sub.id }, orderBy: { periodStart: "desc" } }))?.id ?? "",
              subscriptionId: sub.id,
              status: "FAILED",
              provider: event.provider,
              providerRef: event.providerRef,
              amountMinor: event.amountMinor ?? 0,
              currency: event.currency ?? "TZS",
              failureReason: event.failureReason ?? "unknown",
            },
            update: { status: "FAILED", failureReason: event.failureReason ?? "unknown" },
          });
        }
        await tx.paymentEventLog.update({ where: { id: log.id }, data: { processed: true, processedAt: new Date() } });
        await recordAuditEvent({
          tenantId: sub.tenantId,
          action: "billing.payment.failed",
          entityType: "Subscription",
          entityId: sub.id,
          severity: "WARNING",
          summary: `Payment failed (${event.failureReason ?? "unknown reason"})`,
        });
        return { status: "processed", newStatus: "PAST_DUE" };
      }
      case "SUBSCRIPTION_CANCELLED": {
        // A provider-side cancellation stops renewal but preserves data;
        // access ends only when the period elapses (handled by scheduler).
        await tx.subscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: true } });
        await tx.paymentEventLog.update({ where: { id: log.id }, data: { processed: true, processedAt: new Date() } });
        return { status: "processed" };
      }
      case "SUBSCRIPTION_RENEWED":
      case "REFUND_ISSUED": {
        // Recorded for reconciliation; refunds require manual approval before
        // any balance adjustment, so nothing financial mutates automatically.
        await tx.paymentEventLog.update({ where: { id: log.id }, data: { processed: true, processedAt: new Date() } });
        return { status: "processed" };
      }
      default: {
        await tx.paymentEventLog.update({ where: { id: log.id }, data: { processed: true, error: "unsupported_kind" } });
        return { status: "processed" };
      }
    }
  });
}

/**
 * Entry point for HTTP webhook handlers. Verifies the HMAC signature over the
 * EXACT raw body bytes before parsing anything. Fails closed with 401 on any
 * mismatch — no details about why are returned to the caller.
 */
export async function handleSignedWebhook(rawBody: string, signature: string | undefined, secret: string | undefined) {
  if (!secret) throw ApiError.internal("Webhook signing secret is not configured");
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    await recordAuditEvent({
      action: "billing.webhook.signature_invalid",
      entityType: "PaymentEvent",
      severity: "CRITICAL",
      summary: "Rejected payment webhook with invalid signature",
    });
    throw ApiError.unauthorized("Invalid webhook signature");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw ApiError.validation("Webhook body is not valid JSON");
  }
  const evt = parsed as Record<string, unknown>;
  if (typeof evt.providerEventId !== "string" || typeof evt.kind !== "string" || typeof evt.subscriptionId !== "string") {
    throw ApiError.validation("Malformed payment event payload");
  }
  return processPaymentEvent({
    provider: typeof evt.provider === "string" ? evt.provider : "unknown",
    providerEventId: evt.providerEventId,
    kind: evt.kind as PaymentEventKind,
    subscriptionId: evt.subscriptionId,
    providerRef: typeof evt.providerRef === "string" ? evt.providerRef : undefined,
    amountMinor: typeof evt.amountMinor === "number" ? Math.trunc(evt.amountMinor) : undefined,
    currency: typeof evt.currency === "string" ? evt.currency : undefined,
    failureReason: typeof evt.failureReason === "string" ? evt.failureReason.slice(0, 200) : undefined,
  });
}

// ---------------------------------------------------------------------------
// Reconciliation helpers
// ---------------------------------------------------------------------------

/** Sum outstanding (OPEN) billing invoice totals in minor units per currency. */
export async function outstandingBalances(tenantId: string) {
  const rows = await prisma.billingInvoice.groupBy({
    by: ["currency"],
    where: { subscription: { tenantId }, status: "OPEN" },
    _sum: { totalMinor: true },
  });
  return rows.map((r) => ({ currency: r.currency, openTotalMinor: r._sum.totalMinor ?? 0 }));
}

/** List recent payment event log entries (metadata only — never payloads). */
export async function listRecentEvents(limit = 50) {
  return prisma.paymentEventLog.findMany({
    orderBy: { receivedAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
    select: { id: true, provider: true, providerEventId: true, kind: true, processed: true, receivedAt: true },
  });
}
