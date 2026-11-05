import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroySession,
} from "@/lib/auth/session";
import {
  assertSameOrigin,
  clientIp,
  jsonError,
  jsonNoStore,
  rateLimitKey,
  tooManyRequests,
} from "@/lib/auth/api";
import { AUTH_RATE_LIMITS, clearRateLimit, consumeRateLimit } from "@/lib/auth/rate-limit";
import { signInSchema } from "@/lib/auth/validation";
import { resolvePostAuthDestination } from "@/lib/auth/destination";
import { createAuditLog } from "@/server/services/audit/audit.service";

export const dynamic = "force-dynamic";

/**
 * A valid scrypt hash used to equalise work for unknown accounts. Without it,
 * a missing user returns measurably faster than a wrong password.
 */
const DUMMY_PASSWORD_HASH = hashPassword("ono-timing-equalizer");

export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const body = await request.json().catch(() => null);
    const parsed = signInSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(400, "Enter a valid email address and password.");
    }

    const { email, password, rememberMe, next } = parsed.data;
    const ipAddress = clientIp(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const ipKey = rateLimitKey("signin:ip", ipAddress);
    const emailKey = rateLimitKey("signin:email", email);

    const [ipLimit, emailLimit] = await Promise.all([
      consumeRateLimit(ipKey, AUTH_RATE_LIMITS.signIn),
      consumeRateLimit(emailKey, AUTH_RATE_LIMITS.signIn),
    ]);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      return tooManyRequests(
        Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds),
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          select: {
            tenantId: true,
            tenant: { select: { status: true } },
          },
        },
      },
    });

    // Deliberately identical responses for unknown accounts and bad passwords.
    if (!user || !user.passwordHash) {
      verifyPassword(password, DUMMY_PASSWORD_HASH);
      await createAuditLog({
        action: AuditAction.LOGIN,
        resource: "auth",
        ipAddress,
        userAgent,
        metadata: { outcome: "failed", reason: "unknown_account" },
      });

      return jsonError(401, "Incorrect email or password.");
    }

    if (!verifyPassword(password, user.passwordHash)) {
      await createAuditLog({
        tenantId: user.tenantId,
        userId: user.id,
        action: AuditAction.LOGIN,
        resource: "auth",
        ipAddress,
        userAgent,
        metadata: { outcome: "failed", reason: "bad_password" },
      });

      return jsonError(401, "Incorrect email or password.");
    }

    if (user.status !== "ACTIVE") {
      await createAuditLog({
        tenantId: user.tenantId,
        userId: user.id,
        action: AuditAction.LOGIN,
        resource: "auth",
        ipAddress,
        userAgent,
        metadata: { outcome: "failed", reason: "suspended" },
      });

      return jsonError(
        403,
        "This account is suspended. Contact your workspace administrator.",
      );
    }

    if (!user.emailVerifiedAt) {
      await createAuditLog({
        tenantId: user.tenantId,
        userId: user.id,
        action: AuditAction.LOGIN,
        resource: "auth",
        ipAddress,
        userAgent,
        metadata: { outcome: "failed", reason: "email_unverified" },
      });

      return jsonNoStore(
        {
          error: "Verify your email address before signing in.",
          code: "EMAIL_UNVERIFIED",
        },
        { status: 403 },
      );
    }

    // Session fixation: a session cookie presented before authentication is
    // revoked and replaced, never upgraded in place.
    await destroySession().catch(() => undefined);

    const { session } = await createSession({
      userId: user.id,
      userAgent,
      ipAddress,
      rememberMe,
    });

    await clearRateLimit(emailKey);

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: AuditAction.LOGIN,
      resource: "auth",
      resourceId: session.id,
      ipAddress,
      userAgent,
      metadata: { outcome: "success", rememberMe },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const activeMemberships = user.memberships.filter(
      (membership) => membership.tenant.status === "ACTIVE",
    );

    const redirectTo = resolvePostAuthDestination(
      {
        isPlatformAdmin: user.role === "PLATFORM_ADMIN",
        memberships: activeMemberships.map((membership) => ({
          tenantId: membership.tenantId,
        })),
      },
      next,
    );

    return jsonNoStore({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: true,
        workspaceCount: activeMemberships.length,
      },
      redirectTo,
    });
  } catch (error) {
    console.error(
      "Login error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(
      503,
      "Unable to sign in right now. Please try again in a moment.",
    );
  }
}
