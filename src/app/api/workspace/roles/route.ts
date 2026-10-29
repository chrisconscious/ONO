import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { z } from "zod";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi, serialise } from "@/lib/api/tenant";
import { handleWriteError } from "@/lib/api/write-errors";
import { createAuditLog } from "@/server/services/audit/audit.service";
import {
  createWorkspaceRole,
  listWorkspaceRoleDetails,
} from "@/server/services/workspace/governance.service";

const roleSchema = z.object({
  name: z.string().trim().min(2, "Role name is required.").max(80),
  description: z.string().trim().max(240).optional(),
  permissionCodes: z.array(z.string().trim().min(1)).max(200),
});

/** Lists workspace roles with their permission codes. */
export async function GET() {
  const auth = await requireTenantApi("PERM-ROLE.READ");
  if (auth.error) return auth.error;

  try {
    const roles = await listWorkspaceRoleDetails(auth.tenantId);
    return Response.json({ roles });
  } catch (error) {
    console.error("List workspace roles error:", error);
    return jsonError(500, "Unable to load roles.");
  }
}

/** Creates a custom role. Only catalogue permission codes are accepted. */
export async function POST(request: NextRequest) {
  const auth = await requireTenantApi("PERM-ROLE.CREATE");
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (body === null) return jsonError(400, "Provide a request body.");

  try {
    const data = roleSchema.parse(body);
    const result = await createWorkspaceRole({
      tenantId: auth.tenantId,
      name: data.name,
      description: data.description,
      permissionCodes: data.permissionCodes,
    });

    if ("error" in result) return jsonError(409, result.error);

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.CREATE,
      resource: "workspace_role",
      resourceId: result.role.id,
      ...requestMeta(request),
      metadata: { module: "Governance", name: result.role.name },
    });

    return Response.json({ role: serialise(result.role) }, { status: 201 });
  } catch (error) {
    return handleWriteError(error, "workspace role");
  }
}
