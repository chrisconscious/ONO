import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import {
  assertSameOrigin,
  jsonError,
  jsonNoStore,
  rateLimitKey,
  requestMeta,
  tooManyRequests,
} from "@/lib/auth/api";
import { AUTH_RATE_LIMITS, consumeRateLimit } from "@/lib/auth/rate-limit";
import { profileSchema } from "@/lib/auth/validation";
import { issueAuthToken, invalidateAuthTokens } from "@/lib/auth/tokens";
import { appBaseUrl } from "@/lib/auth/urls";
import { sendEmail } from "@/lib/email/email.service";
import { createAuditLog } from "@/server/services/audit/audit.service";

export const dynamic = "force-dynamic";

/**
 * Updates the authenticated user's own profile.
 *
 * A new email address is never written directly to `users.email`. It is stored
 * as `pendingEmail` and only promoted once the single-use verification link is
 * consumed, so a typo cannot lock the owner out of their account.
 */
export async function PATCH(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const session = await getCurrentSession();
    if (!session) return jsonError(401, "Authentication required.");

    const body = await request.json().catch(() => null);
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return jsonNoStore(
        {
          error: "Check the highlighted field and try again.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, phone, email } = parsed.data;
    const current = session.user;
    const fields: string[] = ["name"];

    const data: {
      name: string;
      phone?: string | null;
      pendingEmail?: string | null;
    } = { name };

    if (phone !== undefined) {
      data.phone = phone.length > 0 ? phone : null;
      fields.push("phone");
    }

    let pendingEmail: string | null | undefined;
    let emailVerificationLink: string | null = null;
    let emailDelivered = false;

    if (email !== undefined && email !== current.email) {
      if (email === current.pendingEmail) {
        pendingEmail = email;
      } else {
        const taken = await prisma.user.findFirst({
          where: { email, NOT: { id: current.id } },
          select: { id: true },
        });

        if (taken) {
          return jsonNoStore(
            {
              error: "That email address is already in use.",
              details: { email: ["That email address is already in use."] },
            },
            { status: 409 },
          );
        }

        pendingEmail = email;
      }

      const limit = await consumeRateLimit(
        rateLimitKey("profile-email:user", current.id),
        AUTH_RATE_LIMITS.resendVerification,
      );
      if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

      fields.push("pendingEmail");
    }

    if (pendingEmail !== undefined) data.pendingEmail = pendingEmail;

    const user = await prisma.user.update({
      where: { id: current.id },
      data,
      select: { id: true, name: true, email: true, phone: true, pendingEmail: true },
    });

    if (pendingEmail) {
      const { token } = await issueAuthToken({
        userId: current.id,
        type: "EMAIL_VERIFICATION",
      });

      const url = new URL(`${appBaseUrl()}/verify-email`);
      url.searchParams.set("token", token);
      url.searchParams.set("email", pendingEmail);
      url.searchParams.set("mode", "change");
      emailVerificationLink = url.toString();

      const delivery = await sendEmail({
        to: pendingEmail,
        subject: "Confirm your new ONO email address",
        text: [
          "Confirm this address to finish changing the email on your ONO account.",
          "",
          emailVerificationLink,
          "",
          "The link works once and expires after 24 hours. If you did not request this change, ignore this message.",
        ].join("\n"),
      });
      emailDelivered = delivery.delivered;
    } else if (pendingEmail === null) {
      await invalidateAuthTokens(current.id, "EMAIL_VERIFICATION");
    }

    const { ipAddress, userAgent } = requestMeta(request);
    await createAuditLog({
      tenantId: current.tenantId,
      userId: current.id,
      action: AuditAction.UPDATE,
      resource: "user",
      resourceId: current.id,
      ipAddress,
      userAgent,
      metadata: {
        event: pendingEmail ? "profile_email_change_requested" : "profile_updated",
        fields,
      },
    });

    const message = pendingEmail
      ? emailDelivered
        ? `Profile saved. Check ${pendingEmail} to confirm the new address.`
        : `Profile saved. We could not send the verification email to ${pendingEmail}. Try resending it from your profile.`
      : "Profile saved.";

    return jsonNoStore({
      ok: true,
      user,
      message,
      emailChangePending: user.pendingEmail ?? null,
      emailDelivered,
    });
  } catch (error) {
    console.error(
      "Profile update error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(503, "Your profile could not be saved. Please try again.");
  }
}
