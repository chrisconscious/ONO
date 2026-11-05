import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import {
  assertSameOrigin,
  clientIp,
  jsonError,
  jsonNoStore,
  rateLimitKey,
  tooManyRequests,
} from "@/lib/auth/api";
import { AUTH_RATE_LIMITS, consumeRateLimit } from "@/lib/auth/rate-limit";
import { tokenSchema } from "@/lib/auth/validation";
import { consumeAuthToken, invalidateAuthTokens } from "@/lib/auth/tokens";
import { createAuditLog } from "@/server/services/audit/audit.service";

export const dynamic = "force-dynamic";

/**
 * Consumes a verification token.
 *
 * This is a POST endpoint on purpose: opening a link (or a mail scanner
 * prefetching it) must never mark an address as verified. The page shows a
 * button that performs this request.
 */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const body = await request.json().catch(() => null);
    const parsed = tokenSchema.safeParse(
      body && typeof body === "object" && "token" in body
        ? (body as { token?: unknown }).token
        : undefined,
    );

    if (!parsed.success) {
      return jsonError(400, "This verification link is not valid.");
    }

    const token = parsed.data;
    const ipAddress = clientIp(request);

    const [ipLimit, tokenLimit] = await Promise.all([
      consumeRateLimit(
        rateLimitKey("verify:ip", ipAddress),
        AUTH_RATE_LIMITS.verifyEmail,
      ),
      consumeRateLimit(
        rateLimitKey("verify:token", token),
        AUTH_RATE_LIMITS.verifyEmail,
      ),
    ]);

    if (!ipLimit.allowed || !tokenLimit.allowed) {
      return tooManyRequests(
        Math.max(ipLimit.retryAfterSeconds, tokenLimit.retryAfterSeconds),
      );
    }

    const consumed = await consumeAuthToken(token, "EMAIL_VERIFICATION");
    if (!consumed) {
      return jsonError(
        400,
        "This verification link is invalid, has expired, or has already been used.",
      );
    }

    const user = await prisma.user.update({
      where: { id: consumed.userId },
      data: { emailVerifiedAt: new Date() },
      select: { id: true, email: true, tenantId: true },
    });

    await invalidateAuthTokens(user.id, "EMAIL_VERIFICATION");

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: AuditAction.ACTIVATE,
      resource: "user",
      resourceId: user.id,
      ipAddress,
      metadata: { event: "email_verified" },
    });

    return jsonNoStore({
      ok: true,
      email: user.email,
      message: "Email verified. You can sign in now.",
      redirectTo: "/sign-in?reason=verified",
    });
  } catch (error) {
    console.error(
      "Verify-email error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(503, "Verification is unavailable right now. Please try again.");
  }
}
