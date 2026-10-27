import { ok, withTenant } from "@/lib/api/tenant-route";
import * as crm from "@/server/services/crm-service";

/**
 * Lead conversion (duplicate prevention + company/opportunity creation) is a
 * distinct permission so read/write staff cannot silently convert pipeline data.
 */
export const POST = withTenant(async ({ ctx, params }) => {
  return ok(await crm.convertLead(params.id, ctx), 201);
}, { permission: "crm.leads.convert" });
