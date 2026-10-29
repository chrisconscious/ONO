import type { NextRequest } from "next/server";
import { AuditAction, UserRole } from "@prisma/client";
import { z } from "zod";
import { jsonError, requestMeta, resolveApiActor } from "@/lib/auth/api";
import { prisma } from "@/lib/database/prisma";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { updateUserRole } from "@/server/services/platform/users.service";

const patchSchema = z.object({
  role: z.enum([UserRole.PLATFORM_ADMIN, UserRole.TENANT_ADMIN, UserRole.MEMBER]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { actor, response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, "Provide a valid role.");
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, email: true },
  });

  if (!target) {
    return jsonError(404, "User not found.");
  }

  if (target.id === actor.id && parsed.data.role !== UserRole.PLATFORM_ADMIN) {
    return jsonError(400, "You cannot remove your own platform access.");
  }

  if (target.role === UserRole.PLATFORM_ADMIN && parsed.data.role !== UserRole.PLATFORM_ADMIN) {
    const remainingAdmins = await prisma.user.count({
      where: { role: UserRole.PLATFORM_ADMIN, id: { not: target.id } },
    });
    if (remainingAdmins === 0) {
      return jsonError(400, "At least one platform administrator must remain.");
    }
  }

  const user = await updateUserRole(target.id, parsed.data.role);

  await createAuditLog({
    userId: actor.id,
    action: AuditAction.ASSIGN_ROLE,
    resource: "user",
    resourceId: user.id,
    ...requestMeta(request),
    metadata: { email: user.email, from: target.role, to: user.role },
  });

  return Response.json({ user });
}
