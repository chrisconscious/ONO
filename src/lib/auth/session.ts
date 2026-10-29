import { cache } from "react";
import { cookies } from "next/headers";
import type { MembershipStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { generateToken, hashToken } from "./password";

export const SESSION_COOKIE = "ono_session";
const SESSION_DURATION_DAYS = 7;

/** Creates a database-backed session and writes the opaque token to a cookie. */
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string,
) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

/** Returns the live session for the current request, or null. */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          memberships: {
            include: {
              tenant: true,
              roleAssignments: {
                include: {
                  role: {
                    include: {
                      rolePermissions: { include: { permission: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }

  return session;
}

/**
 * Request-scoped memoised session. Layouts and pages run in the same render
 * pass, so this avoids repeating the session query for every component.
 */
export const getCurrentSession = cache(getSession);

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export type TenantMembership = {
  id: string;
  tenantId: string;
  status: MembershipStatus;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    industry: string | null;
  };
  roles: string[];
  permissions: string[];
};

export type CurrentActor = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isPlatformAdmin: boolean;
  memberships: TenantMembership[];
};

/**
 * Normalises a session into the actor shape used by layouts, navigation and
 * permission-aware rendering. This is presentation context only: every write
 * path still re-checks authorization on the server.
 */
export function toActor(session: NonNullable<Awaited<ReturnType<typeof getSession>>>): CurrentActor {
  const memberships: TenantMembership[] = session.user.memberships
    .filter((membership) => membership.status === "ACTIVE")
    .map((membership) => {
      const permissions = new Set<string>();
      const roles: string[] = [];

      for (const assignment of membership.roleAssignments) {
        roles.push(assignment.role.name);
        for (const rolePermission of assignment.role.rolePermissions) {
          permissions.add(rolePermission.permission.code);
        }
      }

      return {
        id: membership.id,
        tenantId: membership.tenantId,
        status: membership.status,
        tenant: {
          id: membership.tenant.id,
          name: membership.tenant.name,
          slug: membership.tenant.slug,
          status: membership.tenant.status,
          industry: membership.tenant.industry,
        },
        roles,
        permissions: [...permissions],
      };
    });

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    isPlatformAdmin: session.user.role === "PLATFORM_ADMIN",
    memberships,
  };
}

/** Returns the current actor, or null when unauthenticated. */
export const getCurrentActor = cache(async (): Promise<CurrentActor | null> => {
  const session = await getCurrentSession();
  return session ? toActor(session) : null;
});
