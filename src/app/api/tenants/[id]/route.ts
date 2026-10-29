import type { NextRequest } from "next/server";
import { AuditAction, TenantStatus } from "@prisma/client";
import { z } from "zod";
import { jsonError, requestMeta, resolveApiActor } from "@/lib/auth/api";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { setTenantStatus } from "@/server/services/platform/tenants.service";

const patchSchema = z.object({
  status: z.enum([
    TenantStatus.PROVISIONING,
    TenantStatus.ACTIVE,
    TenantStatus.SUSPENDED,
    TenantStatus.CLOSING,
    TenantStatus.CLOSED,
  ]),
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
    return jsonError(400, "Provide a valid tenant status.");
  }

  try {
    const tenant = await setTenantStatus(id, parsed.data.status);

    const action =
      parsed.data.status === TenantStatus.SUSPENDED
        ? AuditAction.SUSPEND
        : parsed.data.status === TenantStatus.ACTIVE
          ? AuditAction.ACTIVATE
          : AuditAction.UPDATE;

    await createAuditLog({
      tenantId: tenant.id,
      userId: actor.id,
      action,
      resource: "tenant",
      resourceId: tenant.id,
      ...requestMeta(request),
      metadata: { status: tenant.status },
    });

    return Response.json({ tenant });
  } catch {
    return jsonError(404, "Tenant not found.");
  }
}
