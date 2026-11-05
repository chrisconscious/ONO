import type { NextRequest } from "next/server";
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
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { issueAuthToken } from "@/lib/auth/tokens";
import { authLink } from "@/lib/auth/urls";
import { sendEmail } from "@/lib/email/email.service";

export const dynamic = "force-dynamic";

/**
 * Requests a password reset link.
 *
 * The response is identical whether or not the address belongs to an account.
 * Only a hash of the issued token is stored, and a previous unused reset token
 * is invalidated when a new one is issued.
 */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const body = await request.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(400, "Enter a valid email address.");
    }

    const { email } = parsed.data;
    const ipAddress = clientIp(request);

    const [ipLimit, emailLimit] = await Promise.all([
      consumeRateLimit(
        rateLimitKey("forgot:ip", ipAddress),
        AUTH_RATE_LIMITS.forgotPassword,
      ),
      consumeRateLimit(
        rateLimitKey("forgot:email", email),
        AUTH_RATE_LIMITS.forgotPassword,
      ),
    ]);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      return tooManyRequests(
        Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds),
      );
    }

    let devResetUrl: string | undefined;
    let delivery: { delivered: boolean } = { delivered: false };

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, status: true, emailVerifiedAt: true },
    });

    if (user && user.status === "ACTIVE" && user.emailVerifiedAt) {
      const { token } = await issueAuthToken({
        userId: user.id,
        type: "PASSWORD_RESET",
      });

      const resetUrl = authLink("/reset-password", token);
      delivery = await sendEmail({
        to: user.email,
        subject: "Reset your ONO password",
        text: [
          "Use the link below to choose a new password for your ONO account.",
          "",
          resetUrl,
          "",
          "This link expires in one hour and can be used once.",
          "If you did not request a reset, you can ignore this message. Your password has not changed.",
        ].join("\n"),
      });

      if (process.env.NODE_ENV !== "production" && delivery.delivered) {
        devResetUrl = resetUrl;
      }
    }

    return jsonNoStore({
      ok: true,
      emailDelivery: delivery.delivered ? "sent" : "unavailable",
      message:
        "If an account exists for that email, a reset link has been sent.",
      ...(devResetUrl ? { devResetUrl } : {}),
    });
  } catch (error) {
    console.error(
      "Forgot-password error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    // Still neutral: an outage must not reveal whether the address exists.
    return jsonError(503, "Password recovery is unavailable right now. Please try again.");
  }
}
