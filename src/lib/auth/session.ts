import { cookies } from "next/headers";
type CookieOptions = {
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
  path: string;
  maxAge: number;
};
import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import type { MemberRole, Permission } from "@/lib/permissions/rbac";
import { permissionsForRole } from "@/lib/permissions/rbac";

export const SESSION_COOKIE = "ono_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

/** Creates a server-side session row and sets the cookie. Returns raw token (shown once). */
export async function createSession(
  userId: string,
  meta?: { userAgent?: string | null; ip?: string | null },
): Promise<string> {
  const { token, tokenHash } = generateOpaqueToken();
  const memberships = await prisma.membership.findMany({
    where: { userId, isActive: true, tenant: { isActive: true } },
    select: { tenantId: true },
  });
  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      userAgent: meta?.userAgent ?? null,
      ip: meta?.ip ?? null,
      tenants: { create: memberships.map((m) => ({ tenantId: m.tenantId })) },
    },
  });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
  return token;
}

export async function destroyCurrentSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return;
  const tokenHash = hashToken(token);
  await prisma.session.updateMany({
    where: { tokenHash, status: "ACTIVE" },
    data: { status: "REVOKED", revokedAt: new Date() },
  });
  (await cookies()).delete(SESSION_COOKIE);
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
}

/** Resolves the session cookie to an active user or throws 401. */
export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const identity = await resolveSessionIdentity();
  if (!identity) throw ApiError.unauthorized();
  return identity;
}

export async function resolveSessionIdentity(): Promise<AuthenticatedUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, name: true, isActive: true } } },
  });
  if (!session) return null;
  if (session.status !== "ACTIVE" || session.expiresAt.getTime() < Date.now()) return null;
  if (!session.user.isActive) return null;
  return { id: session.user.id, email: session.user.email, name: session.user.name };
}

export interface TenantContext {
  user: AuthenticatedUser;
  tenantId: string;
  role: MemberRole;
  membershipId: string;
  permissions: ReadonlySet<Permission>;
  sessionId: string;
}

/**
 * Verifies the authenticated user is an ACTIVE member of `tenantId` and that
 * the session was issued for that tenant. Never trusts a client-supplied role.
 * Throws 403 when membership is missing/inactive so probes can't distinguish
 * existence from non-membership without access.
 */
export async function requireTenantMembership(
  user: AuthenticatedUser,
  tenantId: string,
): Promise<TenantContext> {
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
    include: { tenant: { select: { isActive: true } } },
  });
  if (!membership || !membership.isActive || !membership.tenant.isActive) {
    throw ApiError.forbidden("You are not a member of this organization");
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  let sessionId = "";
  if (token) {
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true },
    });
    sessionId = session?.id ?? "";
  }
  return {
    user,
    tenantId,
    role: membership.role,
    membershipId: membership.id,
    permissions: permissionsForRole(membership.role),
    sessionId,
  };
}

/** Convenience: full auth+tenant scope for a route handler. */
export async function authenticateTenantRequest(tenantId: string): Promise<TenantContext> {
  const user = await requireAuthenticatedUser();
  return requireTenantMembership(user, tenantId);
}

/** Guard: throws 403 unless the context has the permission. */
export function requirePermission(ctx: TenantContext, permission: Permission): void {
  if (!ctx.permissions.has(permission)) {
    throw ApiError.forbidden(`Missing permission: ${permission}`);
  }
}
