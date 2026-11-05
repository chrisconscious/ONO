import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import {
  assertSameOrigin,
  jsonError,
  jsonNoStore,
  requestMeta,
} from "@/lib/auth/api";
import { profileSchema } from "@/lib/auth/validation";
import { createAuditLog } from "@/server/services/audit/audit.service";

export const dynamic = "force-dynamic";

/** Updates the authenticated user's own display name. */
export async function PATCH(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const session = await getCurrentSession();
    if (!session) return jsonError(401, "Authentication required.");

    const body = await request.json().catch(() => null);
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return jsonNoStore(
        {
          error: "Check the highlighted field and try again.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
      select: { id: true, name: true, email: true },
    });

    const { ipAddress, userAgent } = requestMeta(request);
    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: "user",
      resourceId: session.user.id,
      ipAddress,
      userAgent,
      metadata: { event: "profile_updated", fields: ["name"] },
    });

    return jsonNoStore({ ok: true, user });
  } catch (error) {
    console.error(
      "Profile update error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(503, "Your profile could not be saved. Please try again.");
  }
}
