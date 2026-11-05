import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import {
  destroySession,
  getCurrentSession,
  revokeSession,
} from "@/lib/auth/session";
import {
  assertSameOrigin,
  jsonError,
  jsonNoStore,
  requestMeta,
} from "@/lib/auth/api";
import { createAuditLog } from "@/server/services/audit/audit.service";

export const dynamic = "force-dynamic";

/** Revokes one session owned by the authenticated account. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const session = await getCurrentSession();
    if (!session) return jsonError(401, "Authentication required.");

    const { id } = await params;
    const isCurrent = id === session.id;

    const revoked = await revokeSession(id, session.user.id);
    if (!revoked) {
      return jsonError(404, "That session is not active for this account.");
    }

    if (isCurrent) {
      await destroySession();
    }

    const { ipAddress, userAgent } = requestMeta(request);
    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: AuditAction.REVOKE_ACCESS,
      resource: "auth_session",
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { event: "session_revoked", current: isCurrent },
    });

    return jsonNoStore({
      ok: true,
      signedOut: isCurrent,
      ...(isCurrent ? { redirectTo: "/sign-in?reason=signed-out" } : {}),
    });
  } catch (error) {
    console.error(
      "Session revoke error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(503, "That session could not be revoked. Please try again.");
  }
}
