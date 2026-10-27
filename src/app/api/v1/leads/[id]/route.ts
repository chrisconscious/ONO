import { ok, readJsonBody, withTenant } from "@/lib/api/tenant-route";
import * as crm from "@/server/services/crm-service";

/** Single-lead endpoints. All service calls enforce tenant scope internally. */
export const GET = withTenant(async ({ ctx, params }) => {
  return ok(await crm.getLead(params.id, ctx));
}, { permission: "crm.read" });

export const PATCH = withTenant(async ({ ctx, params, request }) => {
  const body = await readJsonBody(request);
  return ok(await crm.updateLead(params.id, body, ctx));
}, { permission: "crm.write" });

export const DELETE = withTenant(async ({ ctx, params }) => {
  return ok(await crm.deleteLead(params.id, ctx));
}, { permission: "crm.delete" });
