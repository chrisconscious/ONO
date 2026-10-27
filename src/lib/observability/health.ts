/**
 * Backend health-check core.
 *
 * Separates three concerns so orchestrators get accurate signals:
 *  - liveness   : is the process up at all (no dependency checks)
 *  - readiness  : can we serve business traffic (database reachable)
 *  - dependency : per-dependency status for operators
 *
 * Optional dependencies (e.g. an AI provider) NEVER affect readiness —
 * an AI outage must not take CRM/finance APIs offline. Responses are
 * deliberately minimal: no credentials, no internal config, no stacks.
 */
import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

export type DependencyStatus = "healthy" | "degraded" | "unavailable";

export interface CheckResult {
  name: string;
  status: DependencyStatus;
  latencyMs: number;
  /** Static detail safe to expose (never secrets or tenant data). */
  detail?: string;
}

export interface HealthReport {
  status: "ok" | "not_ready";
  service: string;
  version: string;
  timestamp: string;
  checks: CheckResult[];
}

// Bounded timeout so a hung DB connection fails the check instead of
// hanging the load balancer's probes forever.
const DB_CHECK_TIMEOUT_MS = 2000;

/**
 * Verify database connectivity with a trivial bounded query.
 * `client` is injectable so tests can simulate failures without a real DB.
 */
export async function checkDatabase(
  client: PrismaClient,
  timeoutMs = DB_CHECK_TIMEOUT_MS,
): Promise<CheckResult> {
  const start = performance.now();
  try {
    await Promise.race([
      client.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("db check timed out")), timeoutMs),
      ),
    ]);
    return {
      name: "database",
      status: "healthy",
      latencyMs: Math.round(performance.now() - start),
    };
  } catch (error) {
    // Log full error server-side (redacted); never return it to callers.
    logger.error("Database health check failed", error, { timeoutMs });
    return {
      name: "database",
      status: "unavailable",
      latencyMs: Math.round(performance.now() - start),
      detail: "database unreachable",
    };
  }
}

/** Aggregate a readiness report from individual dependency results. */
export function buildReadinessReport(
  checks: CheckResult[],
  meta: { service: string; version: string },
): HealthReport {
  const ready = checks.every((c) => c.status === "healthy");
  return {
    status: ready ? "ok" : "not_ready",
    service: meta.service,
    version: meta.version,
    timestamp: new Date().toISOString(),
    checks: checks.map(({ name, status, detail }) => ({
      // Strip latency from the public payload; timing stays in logs/metrics.
      name,
      status,
      latencyMs: 0,
      ...(detail ? { detail } : {}),
    })),
  };
}
