import type { AuditLog, Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { describeUserAgent } from "@/lib/auth/device";

export type SecurityEvent = {
  id: string;
  label: string;
  detail: string | null;
  ipAddress: string | null;
  createdAt: string;
};

const eventLabels: Record<string, string> = {
  password_changed: "Password changed",
  email_changed: "Email address changed",
  profile_email_change_requested: "Email change requested",
  profile_email_change_resent: "Email confirmation resent",
  profile_email_change_cancelled: "Email change cancelled",
  profile_updated: "Profile updated",
  preferences_updated: "Preferences updated",
  avatar_uploaded: "Profile photo updated",
  avatar_removed: "Profile photo removed",
  other_sessions_revoked: "Other sessions signed out",
};

function metadataValue(
  metadata: Prisma.JsonValue | null,
  key: string,
): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function eventLabel(log: Pick<AuditLog, "action" | "resource" | "metadata">) {
  if (log.action === "LOGIN") {
    const outcome = metadataValue(log.metadata, "outcome");
    return outcome === "success" ? "Signed in" : "Failed sign-in attempt";
  }

  if (log.action === "LOGOUT") return "Signed out";
  if (log.action === "REVOKE_ACCESS") return "Other sessions signed out";

  const event = metadataValue(log.metadata, "event");
  return (event && eventLabels[event]) ?? "Account activity";
}

/**
 * Recent security-relevant events for the signed-in account.
 *
 * Only the owner's rows are selected, and only presentation-safe metadata is
 * returned. Raw audit metadata is never forwarded to the browser.
 */
export async function listSecurityActivity(
  userId: string,
  limit = 8,
): Promise<SecurityEvent[]> {
  const logs = await prisma.auditLog.findMany({
    where: {
      userId,
      OR: [
        { action: { in: ["LOGIN", "LOGOUT", "REVOKE_ACCESS"] } },
        { action: "UPDATE", resource: "user" },
        { action: "DELETE", resource: "user" },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      resource: true,
      metadata: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
  });

  return logs.map((log) => ({
    id: log.id,
    label: eventLabel(log),
    detail: log.userAgent ? describeUserAgent(log.userAgent) : null,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt.toISOString(),
  }));
}
