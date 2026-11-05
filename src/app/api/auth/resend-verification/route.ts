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
import { emailSchema } from "@/lib/auth/validation";
import { getCurrentSession } from "@/lib/auth/session";
import { issueAuthToken } from "@/lib/auth/tokens";
import { authLink } from "@/lib/auth/urls";
import { sendEmail } from "@/lib/email/email.service";

export const dynamic = "force-dynamic";

/**
 * Re-issues a verification link. The response is neutral so it cannot be used
 * to probe which addresses have accounts.
 */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const body = await request.json().catch(() => null);
    const session = await getCurrentSession();

    let email: string | null = session?.user.email ?? null;

    if (!email) {
      const parsed = emailSchema.safeParse(
        body && typeof body === "object" && "email" in body
          ? (body as { email?: unknown }).email
          : undefined,
      );
      if (!parsed.success) {
        return jsonError(400, "Enter a valid email address.");
      }
      email = parsed.data;
    }

    const ipAddress = clientIp(request);

    const [ipLimit, emailLimit] = await Promise.all([
      consumeRateLimit(
        rateLimitKey("resend-verify:ip", ipAddress),
        AUTH_RATE_LIMITS.resendVerification,
      ),
      consumeRateLimit(
        rateLimitKey("resend-verify:email", email),
        AUTH_RATE_LIMITS.resendVerification,
      ),
    ]);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      return tooManyRequests(
        Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds),
      );
    }

    let devVerificationUrl: string | undefined;
    let delivered = false;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, status: true, emailVerifiedAt: true },
    });

    if (user && user.status === "ACTIVE" && !user.emailVerifiedAt) {
      const { token } = await issueAuthToken({
        userId: user.id,
        type: "EMAIL_VERIFICATION",
      });

      const verificationUrl = authLink("/verify-email", token);
      const delivery = await sendEmail({
        to: user.email,
        subject: "Verify your ONO email address",
        text: [
          "A new verification link was requested for your ONO account.",
          "",
          verificationUrl,
          "",
          "This link expires in 24 hours and can be used once.",
          "If you did not request it, you can ignore this message.",
        ].join("\n"),
      });

      delivered = delivery.delivered;

      if (process.env.NODE_ENV !== "production" && delivery.delivered) {
        devVerificationUrl = verificationUrl;
      }
    }

    return jsonNoStore({
      ok: true,
      emailDelivery: delivered ? "sent" : "unavailable",
      message:
        "If that address needs verification, a new link has been sent.",
      ...(devVerificationUrl ? { devVerificationUrl } : {}),
    });
  } catch (error) {
    console.error(
      "Resend-verification error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(503, "Verification email is unavailable right now. Please try again.");
  }
}
