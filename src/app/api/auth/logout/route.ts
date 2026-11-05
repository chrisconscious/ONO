import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { destroySession, getSession, setSessionEndReason } from "@/lib/auth/session";
import { assertSameOrigin, jsonError, jsonNoStore, requestMeta } from "@/lib/auth/api";
import { createAuditLog } from "@/server/services/audit/audit.service";

export const dynamic = "force-dynamic";

/** Revokes the current database session, clears the cookie and records it. */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const session = await getSession();

    if (session) {
      const { ipAddress, userAgent } = requestMeta(request);
      await createAuditLog({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: AuditAction.LOGOUT,
        resource: "auth",
        resourceId: session.id,
        ipAddress,
        userAgent,
      });
    }

    await destroySession();
    await setSessionEndReason("logout");

    return jsonNoStore({
      ok: true,
      redirectTo: "/sign-in?reason=signed-out",
    });
  } catch (error) {
    console.error(
      "Logout error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(500, "Could not sign out right now. Please try again.");
  }
}
