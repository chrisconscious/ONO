import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import {
  destroySession,
  getCurrentSession,
  revokeSessions,
  setSessionEndReason,
} from "@/lib/auth/session";
import { assertSameOrigin, jsonError, jsonNoStore, requestMeta } from "@/lib/auth/api";
import { createAuditLog } from "@/server/services/audit/audit.service";

export const dynamic = "force-dynamic";

/** Revokes every session for the account, including the current one. */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const session = await getCurrentSession();
    if (!session) {
      return jsonError(401, "Authentication required.");
    }

    const { ipAddress, userAgent } = requestMeta(request);
    const revoked = await revokeSessions(session.user.id);

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: AuditAction.REVOKE_ACCESS,
      resource: "auth_session",
      metadata: { scope: "all_sessions", revoked },
      ipAddress,
      userAgent,
    });

    await destroySession();
    await setSessionEndReason("logout");

    return jsonNoStore({
      ok: true,
      revoked,
      redirectTo: "/sign-in?reason=signed-out",
    });
  } catch (error) {
    console.error(
      "Logout-all error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(500, "Could not sign out of every device. Please try again.");
  }
}
