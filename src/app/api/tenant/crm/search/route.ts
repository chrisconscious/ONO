import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/auth/api";
import { requireTenantApi, serialise } from "@/lib/api/tenant";
import { hasPermission } from "@/lib/permissions/authorize";
import { searchCrm } from "@/server/services/crm/crm.service";

/** Searches CRM records the actor is allowed to read in the active workspace. */
export async function GET(request: NextRequest) {
  const auth = await requireTenantApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  if (query.length < 2) return Response.json({ results: [] });

  try {
    const results = await searchCrm({
      tenantId: auth.tenantId,
      query: query.slice(0, 120),
      can: {
        leads: hasPermission(auth.context, "PERM-LEAD.READ"),
        contacts: hasPermission(auth.context, "PERM-CONTACT.READ"),
        companies: hasPermission(auth.context, "PERM-COMPANY.READ"),
        opportunities: hasPermission(auth.context, "PERM-OPPORTUNITY.READ"),
      },
    });

    return Response.json({ results: serialise(results) });
  } catch (error) {
    console.error("CRM search error:", error);
    return jsonError(500, "Unable to search CRM records.");
  }
}
