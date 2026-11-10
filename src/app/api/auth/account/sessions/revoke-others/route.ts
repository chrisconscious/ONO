import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { getCurrentSession, revokeSessions } from "@/lib/auth/session";
import {
  assertSameOrigin,
  jsonError,
  jsonNoStore,
  requestMeta,
} from "@/lib/auth/api";
import { createAuditLog } from "@/server/services/audit/audit.service";

export const dynamic = "force-dynamic";

/** Signs out every session for the account except the caller's current one. */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const session = await getCurrentSession();
    if (!session) return jsonError(401, "Authentication required.");

    const revoked = await revokeSessions(session.user.id, {
      keepSessionId: session.id,
    });

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: AuditAction.REVOKE_ACCESS,
      resource: "auth_session",
      resourceId: session.user.id,
      ...requestMeta(request),
      metadata: { event: "other_sessions_revoked", revoked },
    });

    return jsonNoStore({
      ok: true,
      revoked,
      message:
        revoked === 0
          ? "No other active sessions were found."
          : `${revoked} other ${revoked === 1 ? "session was" : "sessions were"} signed out.`,
    });
  } catch (error) {
    console.error(
      "Revoke-other-sessions error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(503, "Other sessions could not be signed out. Please try again.");
  }
}
