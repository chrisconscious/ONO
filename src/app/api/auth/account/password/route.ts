import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import {
  getCurrentSession,
  revokeSessions,
  rotateSessionToken,
} from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  assertSameOrigin,
  jsonError,
  jsonNoStore,
  rateLimitKey,
  requestMeta,
  tooManyRequests,
} from "@/lib/auth/api";
import { AUTH_RATE_LIMITS, consumeRateLimit } from "@/lib/auth/rate-limit";
import { changePasswordSchema } from "@/lib/auth/validation";
import { invalidateAuthTokens } from "@/lib/auth/tokens";
import { createAuditLog } from "@/server/services/audit/audit.service";

export const dynamic = "force-dynamic";

/**
 * Changes the password after re-checking the current one.
 *
 * The current session is rotated (new opaque token, new cookie) and every
 * other session is revoked, so a stolen session cannot outlive the change.
 */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const session = await getCurrentSession();
    if (!session) return jsonError(401, "Authentication required.");

    const body = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return jsonNoStore(
        {
          error: "Check the highlighted fields and try again.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const limit = await consumeRateLimit(
      rateLimitKey("password-change:user", session.user.id),
      AUTH_RATE_LIMITS.resetPassword,
    );
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    if (!session.user.passwordHash) {
      return jsonError(400, "This account does not have a password to change.");
    }

    if (!verifyPassword(parsed.data.currentPassword, session.user.passwordHash)) {
      return jsonNoStore(
        {
          error: "Your current password is incorrect.",
          details: { currentPassword: ["Your current password is incorrect."] },
        },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: hashPassword(parsed.data.password) },
    });

    const revoked = await revokeSessions(session.user.id, {
      keepSessionId: session.id,
    });
    await rotateSessionToken(session);
    await invalidateAuthTokens(session.user.id, "PASSWORD_RESET");

    const { ipAddress, userAgent } = requestMeta(request);
    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: "user",
      resourceId: session.user.id,
      ipAddress,
      userAgent,
      metadata: { event: "password_changed", revokedSessions: revoked },
    });

    return jsonNoStore({
      ok: true,
      message: "Password updated. Other devices have been signed out.",
    });
  } catch (error) {
    console.error(
      "Password change error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(503, "Your password could not be changed. Please try again.");
  }
}
