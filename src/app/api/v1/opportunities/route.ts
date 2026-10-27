import { ok, readJsonBody, withTenant } from "@/lib/api/tenant-route";
import * as sales from "@/server/services/sales-service";

export const GET = withTenant(async ({ ctx, request }) => {
  return ok(await sales.listOpportunities(request.nextUrl.searchParams, ctx));
}, { permission: "sales.read" });

export const POST = withTenant(async ({ ctx, request }) => {
  const body = await readJsonBody(request);
  return ok(await sales.createOpportunity(body, ctx), 201);
}, { permission: "sales.write" });
