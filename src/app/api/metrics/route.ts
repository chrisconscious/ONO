import { NextResponse } from "next/server";
import { renderMetrics } from "@/lib/observability/metrics";

export const dynamic = "force-dynamic";

/**
 * Prometheus-format operational metrics.
 *
 * SECURITY: only aggregate, label-safe counters (route/status — never
 * tenant ids or business payloads) are exposed here. If METRICS_TOKEN is
 * configured, scrapers must present it; when unset the endpoint serves
 * only the minimal non-sensitive defaults registered by the app.
 */
export function GET(request: Request) {
  const expected = process.env.METRICS_TOKEN;
  if (expected) {
    const provided = request.headers.get("x-metrics-token");
    // Constant-shape rejection: 401 without revealing why.
    if (provided !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  return new NextResponse(renderMetrics(), {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
