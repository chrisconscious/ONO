import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { resolveSessionIdentity } from "@/lib/auth/session";

/**
 * Server-side platform administration guard.
 *
 * Platform privileges are derived ONLY from the database `User.role` column
 * for the authenticated session — never from email addresses, URLs, cookies,
 * or any client-supplied value. Tenant memberships are irrelevant here; being
 * an organization ADMIN does not grant platform access.
 */

export interface PlatformAdminIdentity {
  id: string;
  email: string;
  name: string | null;
}

/** Returns the platform-admin identity or throws 401/403. */
export async function requirePlatformAdmin(): Promise<PlatformAdminIdentity> {
  const identity = await resolveSessionIdentity();
  if (!identity) throw ApiError.unauthorized();
  // Re-read the live role from the database on every privileged request so a
  // revoked platform role takes effect immediately, even mid-session.
  const user = await prisma.user.findUnique({
    where: { id: identity.id },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) throw ApiError.unauthorized();
  if (user.role !== "PLATFORM_ADMIN") {
    throw ApiError.forbidden("Platform administrator access is required");
  }
  return { id: user.id, email: user.email, name: user.name };
}

/** Non-throwing variant used by server components to decide what to render. */
export async function getPlatformAdminIfAuthorized(): Promise<PlatformAdminIdentity | null> {
  try {
    return await requirePlatformAdmin();
  } catch {
    return null;
  }
}
