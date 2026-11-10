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
import { issueAuthToken, invalidateAuthTokens } from "@/lib/auth/tokens";
import { appBaseUrl } from "@/lib/auth/urls";
import { sendEmail } from "@/lib/email/email.service";
import { createAuditLog } from "@/server/services/audit/audit.service";

export const dynamic = "force-dynamic";

/** Resends the confirmation link for an already-requested email change. */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const session = await getCurrentSession();
  if (!session) return jsonError(401, "Authentication required.");

  if (!session.user.pendingEmail) {
    return jsonError(400, "There is no pending email change to confirm.");
  }

  const limit = await consumeRateLimit(
    rateLimitKey("profile-email:user", session.user.id),
    AUTH_RATE_LIMITS.resendVerification,
  );
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const { token } = await issueAuthToken({
    userId: session.user.id,
    type: "EMAIL_VERIFICATION",
  });

  const url = new URL(`${appBaseUrl()}/verify-email`);
  url.searchParams.set("token", token);
  url.searchParams.set("email", session.user.pendingEmail);
  url.searchParams.set("mode", "change");

  const delivery = await sendEmail({
    to: session.user.pendingEmail,
    subject: "Confirm your new ONO email address",
    text: [
      "Confirm this address to finish changing the email on your ONO account.",
      "",
      url.toString(),
      "",
      "The link works once and expires after 24 hours.",
    ].join("\n"),
  });

  await createAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: AuditAction.UPDATE,
    resource: "user",
    resourceId: session.user.id,
    ...requestMeta(request),
    metadata: { event: "profile_email_change_resent", delivered: delivery.delivered },
  });

  return jsonNoStore({
    ok: true,
    emailDelivered: delivery.delivered,
    message: delivery.delivered
      ? `A new confirmation link was sent to ${session.user.pendingEmail}.`
      : `The link was created, but email delivery is unavailable in this environment.`,
  });
}

/** Cancels a pending email change and invalidates its confirmation link. */
export async function DELETE(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const session = await getCurrentSession();
  if (!session) return jsonError(401, "Authentication required.");

  if (!session.user.pendingEmail) {
    return jsonError(400, "There is no pending email change to cancel.");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { pendingEmail: null },
  });
  await invalidateAuthTokens(session.user.id, "EMAIL_VERIFICATION");

  await createAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: AuditAction.UPDATE,
    resource: "user",
    resourceId: session.user.id,
    ...requestMeta(request),
    metadata: { event: "profile_email_change_cancelled" },
  });

  return jsonNoStore({ ok: true, message: "Email change cancelled." });
}
