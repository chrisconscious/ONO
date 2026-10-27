import { ApiError } from "@/lib/api/errors";
import { ok, withTenant } from "@/lib/api/tenant-route";
import * as analytics from "@/server/services/analytics-ai-service";

/**
 * Read-only operational KPIs computed from persisted records. Metrics are
 * strictly tenant-scoped; nothing is hardcoded or fabricated here.
 */
export const GET = withTenant(async ({ ctx, request }) => {
  const metric = request.nextUrl.searchParams.get("metric") ?? "sales-summary";
  switch (metric) {
    case "sales-summary":
      return ok(await analytics.getSalesSummary(ctx));
    case "receivables-aging":
      return ok(await analytics.getReceivablesAging(ctx));
    default:
      throw ApiError.validation(`Unknown metric: ${metric}`);
  }
}, { permission: "analytics.read" });
