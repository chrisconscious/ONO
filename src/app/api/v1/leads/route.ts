import { NextResponse } from "next/server";
import { ok, readJsonBody, withTenant } from "@/lib/api/tenant-route";
import * as crm from "@/server/services/crm-service";

/**
 * CRM lead collection endpoint. All operations are tenant-scoped through the
 * trusted TenantContext; permissions are enforced before any service call.
 */
export const GET = withTenant(async ({ ctx, request }) => {
  return ok(await crm.listLeads(request.nextUrl.searchParams, ctx));
}, { permission: "crm.read" });

export const POST = withTenant(async ({ ctx, request }) => {
  const body = await readJsonBody(request);
  return ok(await crm.createLead(body, ctx), 201);
}, { permission: "crm.write" });
