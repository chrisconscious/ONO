import { prisma } from "@/lib/database/prisma";
import type { UsageMetric } from "@prisma/client";

/**
 * Usage metering service (Stage 14).
 *
 * Counters are stored per (tenant, metric, window) with a unique constraint,
 * so retries of the same increment cannot double-count beyond the increments
 * actually applied, and tenant windows can never merge: every query is keyed
 * by an explicit tenantId supplied by server-side context.
 *
 * Window formats:
 * - Day windows:   "YYYY-MM-DD"  (API/AI daily limits)
 * - Month windows: "YYYY-MM"     (aggregated reporting)
 */

export function dayWindow(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function monthWindow(d: Date = new Date()): string {
  return d.toISOString().slice(0, 7);
}

/**
 * Atomically add `amount` to a tenant's counter for a metric/window.
 * Uses upsert with an increment so concurrent calls compose safely at the
 * database level (single UPDATE ... value = value + n per call).
 */
export async function recordUsage(tenantId: string, metric: UsageMetric, amount = 1n, window?: string): Promise<void> {
  const win = window ?? dayWindow();
  await prisma.usageRecord.upsert({
    where: { tenantId_metric_window: { tenantId, metric, window: win } },
    create: { tenantId, metric, window: win, value: amount },
    update: { value: { increment: amount } },
  });
}

/** Read one counter (0 when absent — missing means zero usage, never null-in-report). */
export async function getUsage(tenantId: string, metric: UsageMetric, window?: string): Promise<bigint> {
  const win = window ?? dayWindow();
  const row = await prisma.usageRecord.findUnique({
    where: { tenantId_metric_window: { tenantId, metric, window: win } },
  });
  return row?.value ?? 0n;
}

/** Usage history for a metric across recent windows (newest first). */
export async function usageHistory(tenantId: string, metric: UsageMetric, limit = 31) {
  const rows = await prisma.usageRecord.findMany({
    where: { tenantId, metric },
    orderBy: { window: "desc" },
    take: Math.min(Math.max(limit, 1), 366),
  });
  return rows.map((r) => ({ window: r.window, value: r.value.toString(), updatedAt: r.updatedAt }));
}

/**
 * Snapshot all current-window counters for a tenant — used by admin/tenant
 * APIs to make limit proximity visible before enforcement bites.
 */
export async function currentUsageSnapshot(tenantId: string) {
  const metrics: UsageMetric[] = ["ACTIVE_USERS", "API_REQUESTS", "AI_INFERENCES", "AUTOMATION_RUNS", "STORAGE_BYTES"];
  const win = dayWindow();
  const rows = await prisma.usageRecord.findMany({
    where: { tenantId, window: { in: [win, monthWindow()] } },
  });
  const out: Partial<Record<UsageMetric, string>> = {};
  for (const m of metrics) {
    const row = rows.find((r) => r.metric === m);
    if (row) out[m] = row.value.toString();
  }
  // ACTIVE_USERS is derived from memberships rather than an event counter:
  // the authoritative source of truth is the membership table itself.
  out.ACTIVE_USERS = (await prisma.membership.count({ where: { tenantId, isActive: true } })).toString();
  return { window: win, usage: out };
}
