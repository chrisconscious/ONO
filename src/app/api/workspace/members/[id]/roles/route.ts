import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { z } from "zod";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi } from "@/lib/api/tenant";
import { handleWriteError } from "@/lib/api/write-errors";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { assignMemberRoles } from "@/server/services/workspace/governance.service";

const assignmentSchema = z.object({
  roleIds: z.array(z.string().trim().min(1)).max(20),
});

/** Replaces the role set for one member of the active workspace. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireTenantApi("PERM-MEMBER.UPDATE");
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (body === null) return jsonError(400, "Provide a request body.");

  try {
    const data = assignmentSchema.parse(body);
    const result = await assignMemberRoles({
      tenantId: auth.tenantId,
      membershipId: id,
      roleIds: data.roleIds,
      actorMembershipId: auth.membership.id,
    });

    if (!("ok" in result)) return jsonError(409, result.error);

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.ASSIGN_ROLE,
      resource: "workspace_membership",
      resourceId: id,
      ...requestMeta(request),
      metadata: { module: "Governance", roleIds: data.roleIds },
    });

    return Response.json({ updated: true });
  } catch (error) {
    return handleWriteError(error, "member roles");
  }
}
