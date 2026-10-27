import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { checkDatabase, buildReadinessReport } from "@/lib/observability/health";
import { getServerEnv } from "@/lib/configuration/env";

export const dynamic = "force-dynamic";

/**
 * Readiness probe: returns 200 only when required dependencies (database)
 * are reachable. Optional dependencies are intentionally not checked here —
 * an AI-provider outage must not mark the whole app unready.
 * Response body contains no credentials, config values, or stack traces.
 */
export async function GET() {
  const env = getServerEnv();
  const checks = [await checkDatabase(prisma)];
  const report = buildReadinessReport(checks, {
    service: "ono",
    version: env.APP_VERSION,
  });
  return NextResponse.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
