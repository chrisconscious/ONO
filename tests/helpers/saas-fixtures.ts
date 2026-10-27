/**
 * Stage 14/15 SaaS fixtures: plan catalogue seeding and subscription helpers.
 *
 * PlanDefinition rows are platform-owned commercial reference data. The
 * numbers used here are TEST VALUES ONLY (clearly named) — they must never
 * be presented as ClickIT's approved pricing. Tests need concrete limits to
 * exercise entitlement enforcement; the mechanism, not the values, is what
 * is under test.
 */
import { randomUUID } from "node:crypto";
import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";

export interface SeedPlanOptions {
  code: SubscriptionPlan;
  priceMinor?: number;
  maxSeats?: number | null;
  includedModules?: string[];
  apiLimitPerDay?: number | null;
  aiLimitPerDay?: number | null;
}

/** Upsert a plan definition so tests can rely on deterministic entitlements. */
export async function seedPlan(opts: SeedPlanOptions) {
  const data = {
    name: `Test plan ${opts.code}`,
    billingPeriod: "MONTHLY" as const,
    priceMinor: opts.priceMinor ?? 50_000, // 500.00 TZS in minor units
    currency: "TZS",
    maxSeats: opts.maxSeats ?? null,
    includedModules: opts.includedModules ?? [],
    apiLimitPerDay: opts.apiLimitPerDay ?? null,
    aiLimitPerDay: opts.aiLimitPerDay ?? null,
    isActive: true,
  };
  return prisma.planDefinition.upsert({
    where: { code: opts.code },
    create: { code: opts.code, ...data },
    update: data,
  });
}

/** Move (or create) a tenant's subscription into an explicit status for tests. */
export async function setSubscription(
  tenantId: string,
  patch: {
    plan?: SubscriptionPlan;
    status?: "PENDING_ACTIVATION" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "GRACE_PERIOD" | "RESTRICTED" | "CANCELLED" | "EXPIRED" | "SUSPENDED" | "TERMINATED";
    seats?: number;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    trialEndsAt?: Date | null;
    cancelAtPeriodEnd?: boolean;
  },
) {
  const existing = await prisma.subscription.findUnique({ where: { tenantId } });
  if (existing) {
    return prisma.subscription.update({ where: { id: existing.id }, data: patch });
  }
  return prisma.subscription.create({
    data: {
      tenantId,
      plan: patch.plan ?? "TRIAL",
      status: patch.status ?? "TRIALING",
      seats: patch.seats ?? 1,
      currentPeriodStart: patch.currentPeriodStart ?? new Date(),
      currentPeriodEnd: patch.currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 3600 * 1000),
      trialEndsAt: patch.trialEndsAt ?? null,
      cancelAtPeriodEnd: patch.cancelAtPeriodEnd ?? false,
    },
  });
}

/** Unique slug generator for provisioning tests (never collides across runs). */
export function uniqueSlug(prefix = "org"): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}
