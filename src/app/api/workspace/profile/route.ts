import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { z } from "zod";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi, serialise } from "@/lib/api/tenant";
import { handleWriteError } from "@/lib/api/write-errors";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { updateWorkspaceIndustry } from "@/server/services/workspace/governance.service";

const profileSchema = z.object({
  industry: z.string().trim().max(120),
});

/** Updates the tenant-editable portion of the workspace profile. */
export async function PATCH(request: NextRequest) {
  const auth = await requireTenantApi("PERM-INDUSTRY.UPDATE");
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (body === null) return jsonError(400, "Provide a request body.");

  try {
    const data = profileSchema.parse(body);
    const tenant = await updateWorkspaceIndustry(auth.tenantId, data.industry);

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.UPDATE,
      resource: "workspace_profile",
      resourceId: auth.tenantId,
      ...requestMeta(request),
      metadata: { module: "Governance", field: "industry" },
    });

    return Response.json({ tenant: serialise(tenant) });
  } catch (error) {
    return handleWriteError(error, "workspace profile");
  }
}
