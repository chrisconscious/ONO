import { ok, withTenant } from "@/lib/api/tenant-route";
import * as auth from "@/server/services/auth-service";

/**
 * Membership roster for the resolved tenant. The tenant ID always comes from
 * the validated session context (never a query parameter), so this endpoint
 * cannot be pointed at another organization.
 */
export const GET = withTenant(async ({ ctx }) => {
  return ok(await auth.listMembers(ctx.tenantId));
}, { permission: "org.members.manage" });
