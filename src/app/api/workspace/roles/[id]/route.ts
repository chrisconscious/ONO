import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { z } from "zod";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi, serialise } from "@/lib/api/tenant";
import { handleWriteError } from "@/lib/api/write-errors";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { updateWorkspaceRole } from "@/server/services/workspace/governance.service";

const roleSchema = z.object({
  name: z.string().trim().min(2, "Role name is required.").max(80),
  description: z.string().trim().max(240).optional(),
  permissionCodes: z.array(z.string().trim().min(1)).max(200),
});

/** Updates a custom role and replaces its permission grants. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireTenantApi("PERM-ROLE.UPDATE");
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (body === null) return jsonError(400, "Provide a request body.");

  try {
    const data = roleSchema.parse(body);
    const result = await updateWorkspaceRole({
      tenantId: auth.tenantId,
      roleId: id,
      name: data.name,
      description: data.description,
      permissionCodes: data.permissionCodes,
    });

    if ("error" in result) return jsonError(409, result.error);

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.UPDATE,
      resource: "workspace_role",
      resourceId: result.role.id,
      ...requestMeta(request),
      metadata: {
        module: "Governance",
        name: result.role.name,
        permissionCount: result.role.permissionCodes.length,
      },
    });

    return Response.json({ role: serialise(result.role) });
  } catch (error) {
    return handleWriteError(error, "workspace role");
  }
}
