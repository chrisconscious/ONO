import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { hashPassword } from "@/lib/auth/password";
import {
  assertSameOrigin,
  clientIp,
  jsonError,
  jsonNoStore,
  rateLimitKey,
  tooManyRequests,
} from "@/lib/auth/api";
import { AUTH_RATE_LIMITS, consumeRateLimit } from "@/lib/auth/rate-limit";
import { resetPasswordSchema } from "@/lib/auth/validation";
import { consumeAuthToken, invalidateAuthTokens } from "@/lib/auth/tokens";
import { destroySession, revokeSessions } from "@/lib/auth/session";
import { createAuditLog } from "@/server/services/audit/audit.service";

export const dynamic = "force-dynamic";

/**
 * Completes a password reset.
 *
 * The token is single-use and only its hash is stored. Every live session for
 * the account is revoked, so an attacker holding an old session loses access
 * as soon as the legitimate owner resets the password.
 */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const body = await request.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return jsonNoStore(
        {
          error: "Check the highlighted fields and try again.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;
    const ipAddress = clientIp(request);

    const [ipLimit, tokenLimit] = await Promise.all([
      consumeRateLimit(
        rateLimitKey("reset:ip", ipAddress),
        AUTH_RATE_LIMITS.resetPassword,
      ),
      consumeRateLimit(
        rateLimitKey("reset:token", token),
        AUTH_RATE_LIMITS.resetPassword,
      ),
    ]);

    if (!ipLimit.allowed || !tokenLimit.allowed) {
      return tooManyRequests(
        Math.max(ipLimit.retryAfterSeconds, tokenLimit.retryAfterSeconds),
      );
    }

    const consumed = await consumeAuthToken(token, "PASSWORD_RESET");
    if (!consumed) {
      return jsonError(
        400,
        "This reset link is invalid, has expired, or has already been used.",
      );
    }

    await prisma.user.update({
      where: { id: consumed.userId },
      data: { passwordHash: hashPassword(password) },
    });

    await invalidateAuthTokens(consumed.userId, "PASSWORD_RESET");
    const revoked = await revokeSessions(consumed.userId);

    // Clearing the cookie inside the same response means even the browser that
    // performed the reset has to authenticate with the new password.
    await destroySession().catch(() => undefined);

    await createAuditLog({
      userId: consumed.userId,
      action: AuditAction.UPDATE,
      resource: "user",
      resourceId: consumed.userId,
      ipAddress,
      metadata: { event: "password_reset", revokedSessions: revoked },
    });

    return jsonNoStore({
      ok: true,
      message: "Password updated. Sign in with your new password.",
      redirectTo: "/sign-in?reason=password-reset",
    });
  } catch (error) {
    console.error(
      "Reset-password error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(503, "Password reset is unavailable right now. Please try again.");
  }
}
