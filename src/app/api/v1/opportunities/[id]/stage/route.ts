import { ok, readJsonBody, withTenant } from "@/lib/api/tenant-route";
import * as sales from "@/server/services/sales-service";

/**
 * Pipeline stage transition. The service parses and validates the move
 * against the allowed-transition graph; invalid transitions surface as 400.
 */
export const POST = withTenant(async ({ ctx, params, request }) => {
  const body = await readJsonBody(request);
  return ok(await sales.moveOpportunityStage(params.id, body, ctx));
}, { permission: "sales.write" });
