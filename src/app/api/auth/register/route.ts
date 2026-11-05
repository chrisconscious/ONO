import type { NextRequest } from "next/server";
import { AuditAction, Prisma } from "@prisma/client";
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
import { signUpSchema, DEFAULT_PREFERENCES } from "@/lib/auth/validation";
import { issueAuthToken } from "@/lib/auth/tokens";
import { authLink } from "@/lib/auth/urls";
import { sendEmail } from "@/lib/email/email.service";
import { createAuditLog } from "@/server/services/audit/audit.service";

export const dynamic = "force-dynamic";

/**
 * Self-service registration.
 *
 * A new account is deliberately unprivileged: no tenant membership and no
 * administrator role. Access to a workspace still requires an invitation from
 * that workspace's administration, so registration cannot widen access.
 */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const body = await request.json().catch(() => null);
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return jsonNoStore(
        {
          error: "Check the highlighted fields and try again.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;
    const ipAddress = clientIp(request);

    const [ipLimit, emailLimit] = await Promise.all([
      consumeRateLimit(rateLimitKey("signup:ip", ipAddress), AUTH_RATE_LIMITS.signUp),
      consumeRateLimit(
        rateLimitKey("signup:email", email),
        AUTH_RATE_LIMITS.signUp,
      ),
    ]);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      return tooManyRequests(
        Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds),
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return jsonError(
        409,
        "An account with this email already exists. Sign in or reset your password.",
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashPassword(password),
        // Never grant a privileged role from a public form.
        role: "MEMBER",
        status: "ACTIVE",
        preferences: DEFAULT_PREFERENCES,
      },
      select: { id: true, email: true },
    });

    const { token } = await issueAuthToken({
      userId: user.id,
      type: "EMAIL_VERIFICATION",
    });

    const verificationUrl = authLink("/verify-email", token);
    const delivery = await sendEmail({
      to: user.email,
      subject: "Verify your ONO email address",
      text: [
        "Confirm this email address to finish setting up your ONO account.",
        "",
        verificationUrl,
        "",
        "This link expires in 24 hours and can be used once.",
        "If you did not create an account, you can ignore this message.",
      ].join("\n"),
    });

    await createAuditLog({
      userId: user.id,
      action: AuditAction.CREATE,
      resource: "user",
      resourceId: user.id,
      ipAddress,
      metadata: { event: "self_registration", emailDelivery: delivery.transport },
    });

    // A development-only affordance: no email provider is configured in this
    // repository, so the console transport prints the link. Never returned in
    // production.
    const devVerificationUrl =
      process.env.NODE_ENV !== "production" && delivery.delivered
        ? verificationUrl
        : undefined;

    return jsonNoStore(
      {
        ok: true,
        email: user.email,
        verificationRequired: true,
        emailDelivery: delivery.delivered ? "sent" : "unavailable",
        ...(devVerificationUrl ? { devVerificationUrl } : {}),
        message:
          "Account created. Check your inbox for the verification link before signing in.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError(
        409,
        "An account with this email already exists. Sign in or reset your password.",
      );
    }

    console.error(
      "Registration error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(503, "Registration is unavailable right now. Please try again.");
  }
}
