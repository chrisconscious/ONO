import { cache } from "react";
import { cookies } from "next/headers";
import type { MembershipStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { generateToken, hashToken } from "./password";
import { SESSION_COOKIE, SESSION_REASON_COOKIE, type SessionEndReason } from "./cookies";
import {
  resolveSessionPolicy,
  sessionWindow,
  shouldTouch,
  touchedWindow,
  newSessionWindow,
  type SessionTiming,
  type SessionWindow,
  type SessionState,
  sessionState,
} from "./policy";
import { parsePreferences, type Preferences } from "./validation";

export { SESSION_COOKIE, SESSION_REASON_COOKIE };

const sessionInclude = {
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
} satisfies Prisma.SessionInclude;

export type SessionWithUser = Prisma.SessionGetPayload<{
  include: typeof sessionInclude;
}>;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

/** Options shared by every write of the session cookie. */
export function sessionCookieOptions(expiresAt?: Date) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    // A "remember me" session gets a persistent cookie; otherwise the cookie
    // disappears with the browser session.
    ...(expiresAt ? { expires: expiresAt } : {}),
  };
}

/**
 * Creates a database-backed session and writes the opaque token to an
 * HTTP-only cookie. Only the SHA-256 hash of the token is stored.
 */
export async function createSession(params: {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  rememberMe?: boolean;
  now?: Date;
}) {
  const policy = resolveSessionPolicy();
  const now = params.now ?? new Date();
  const rememberMe = params.rememberMe ?? false;
  const window = newSessionWindow(policy, rememberMe, now);

  const token = generateToken(32);
  const tokenHash = hashToken(token);

  const session = await prisma.session.create({
    data: {
      userId: params.userId,
      tokenHash,
      expiresAt: window.expiresAt,
      lastActivityAt: window.lastActivityAt,
      absoluteExpiresAt: window.absoluteExpiresAt,
      rememberMe,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions(rememberMe ? window.absoluteExpiresAt : undefined),
  );

  // A fresh sign-in clears any stale "why did I get signed out" notice.
  cookieStore.delete(SESSION_REASON_COOKIE);

  return { token, session };
}

function timingOf(session: {
  createdAt: Date;
  lastActivityAt: Date | null;
  expiresAt: Date;
  absoluteExpiresAt: Date | null;
  rememberMe: boolean;
}): SessionTiming {
  return {
    createdAt: session.createdAt,
    lastActivityAt: session.lastActivityAt,
    expiresAt: session.expiresAt,
    absoluteExpiresAt: session.absoluteExpiresAt,
    rememberMe: session.rememberMe,
  };
}

/**
 * Loads and validates the session for the current request.
 *
 * Both the idle deadline and the absolute deadline are enforced here, on the
 * server, independently of any browser behaviour. A revoked session, a
 * suspended account, or an unknown cookie resolves to null.
 */
export async function getSession(
  now: Date = new Date(),
): Promise<SessionWithUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: sessionInclude,
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.user.status !== "ACTIVE") return null;

  // Self-registered accounts must prove control of their mailbox before any
  // session is honoured. Provisioned accounts are verified at creation.
  if (!session.user.emailVerifiedAt) return null;

  const policy = resolveSessionPolicy();
  if (sessionState(timingOf(session), policy, now) === "expired") return null;

  return session;
}

/**
 * Request-scoped memoised session. Layouts and pages run in the same render
 * pass, so this avoids repeating the session query for every component.
 */
export const getCurrentSession = cache(getSession);

/**
 * Records authenticated activity. Writes are throttled by the policy's touch
 * interval, and the idle deadline can never pass the absolute deadline.
 */
export async function touchSession(
  session: SessionWithUser,
  now: Date = new Date(),
  options: { force?: boolean } = {},
): Promise<SessionWindow> {
  const policy = resolveSessionPolicy();
  const timing = timingOf(session);

  // An expired session can never be revived by activity, even when the caller
  // explicitly asks for a touch.
  const current = sessionWindow(timing, policy, now);
  if (current.remainingMs <= 0) return current;

  if (!options.force && !shouldTouch(timing, policy, now)) {
    return current;
  }

  const next = touchedWindow(timing, policy, now);

  const updated = await prisma.session.updateMany({
    where: {
      id: session.id,
      revokedAt: null,
      ...(options.force
        ? {}
        : {
            OR: [
              { lastActivityAt: null },
              {
                lastActivityAt: {
                  lt: new Date(now.getTime() - policy.touchIntervalMs),
                },
              },
            ],
          }),
    },
    data: {
      lastActivityAt: next.lastActivityAt,
      expiresAt: next.expiresAt,
    },
  });

  if (updated.count === 0 && !options.force) {
    // Another request already refreshed the window. Re-read the row so the
    // value returned to the caller matches the database.
    const refreshed = await prisma.session.findUnique({
      where: { id: session.id },
      select: {
        createdAt: true,
        lastActivityAt: true,
        expiresAt: true,
        absoluteExpiresAt: true,
        rememberMe: true,
      },
    });

    if (!refreshed) return current;

    session.lastActivityAt = refreshed.lastActivityAt;
    session.expiresAt = refreshed.expiresAt;

    return sessionWindow(refreshed, policy, now);
  }

  // Keep the request-scoped session object in sync so later reads inside the
  // same render pass see the refreshed deadlines.
  session.lastActivityAt = next.lastActivityAt;
  session.expiresAt = next.expiresAt;

  return sessionWindow(
    {
      ...timing,
      lastActivityAt: next.lastActivityAt,
      expiresAt: next.expiresAt,
    },
    policy,
    now,
  );
}

/** Revokes the current session (if any) and clears the cookie. */
export async function destroySession(now: Date = new Date()) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  let revoked = false;

  if (token) {
    const result = await prisma.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: now },
    });
    revoked = result.count > 0;
  }

  cookieStore.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(new Date(0)),
    maxAge: 0,
  });

  return { revoked };
}

/** Removes one session that belongs to the user. Returns false if not found. */
export async function revokeSession(
  sessionId: string,
  userId: string,
  now: Date = new Date(),
) {
  const result = await prisma.session.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: now },
  });
  return result.count > 0;
}

/** Looks up a session id from the current cookie, without exposing the token. */
export async function currentSessionId() {
  const session = await getCurrentSession();
  return session?.id ?? null;
}

/** Revokes every session except the one supplied (default: all). */
export async function revokeSessions(
  userId: string,
  options: { keepSessionId?: string; now?: Date } = {},
) {
  const now = options.now ?? new Date();
  const result = await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(options.keepSessionId ? { id: { not: options.keepSessionId } } : {}),
    },
    data: { revokedAt: now },
  });
  return result.count;
}

/**
 * Issues a new opaque token for the same session row and rewrites the cookie.
 * Used after privilege changes such as a password update.
 */
export async function rotateSessionToken(
  session: SessionWithUser,
  now: Date = new Date(),
) {
  const policy = resolveSessionPolicy();
  const token = generateToken(32);
  const window = sessionWindow(timingOf(session), policy, now);

  await prisma.session.update({
    where: { id: session.id },
    data: {
      tokenHash: hashToken(token),
      lastActivityAt: now,
      expiresAt: window.expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions(session.rememberMe ? window.absoluteExpiresAt : undefined),
  );

  return token;
}

/** Safe device summary for the account security screen. Never includes tokens. */
export async function listUserSessions(userId: string, now: Date = new Date()) {
  return prisma.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: now } },
    orderBy: { lastActivityAt: "desc" },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      lastActivityAt: true,
      expiresAt: true,
      absoluteExpiresAt: true,
      rememberMe: true,
    },
  });
}

/** Stores why the last session ended so the sign-in page can explain it. */
export async function setSessionEndReason(reason: SessionEndReason) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_REASON_COOKIE, reason, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5,
  });
}

/**
 * Reads and clears the session-end reason. Only used by the sign-in page.
 * Cookie writes are ignored when called during a render.
 */
export async function readSessionEndReason(): Promise<SessionEndReason | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_REASON_COOKIE)?.value;
  if (value !== "expired" && value !== "revoked" && value !== "logout") {
    return null;
  }
  return value;
}

export async function requireAuth(now: Date = new Date()) {
  const session = await getSession(now);
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

/** Session state and deadlines for UI countdowns. */
export function sessionView(
  session: SessionWithUser,
  now: Date = new Date(),
): SessionWindow & { state: SessionState; rememberMe: boolean } {
  const policy = resolveSessionPolicy();
  const timing = timingOf(session);

  return {
    ...sessionWindow(timing, policy, now),
    state: sessionState(timing, policy, now),
    rememberMe: session.rememberMe,
  };
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
  status: "ACTIVE" | "SUSPENDED";
  isPlatformAdmin: boolean;
  emailVerifiedAt: Date | null;
  preferences: Preferences;
  memberships: TenantMembership[];
};

/**
 * Normalises a session into the actor shape used by layouts, navigation and
 * permission-aware rendering. This is presentation context only: every write
 * path still re-checks authorization on the server.
 */
export function toActor(
  session: SessionWithUser,
  now: Date = new Date(),
): CurrentActor {
  const memberships: TenantMembership[] = session.user.memberships
    .filter(
      (membership) =>
        membership.status === "ACTIVE" &&
        (!membership.expiresAt || membership.expiresAt.getTime() > now.getTime()),
    )
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
    status: session.user.status === "ACTIVE" ? "ACTIVE" : "SUSPENDED",
    isPlatformAdmin: session.user.role === "PLATFORM_ADMIN",
    emailVerifiedAt: session.user.emailVerifiedAt,
    preferences: parsePreferences(session.user.preferences),
    memberships,
  };
}

/** Returns the current actor, or null when unauthenticated. */
export const getCurrentActor = cache(async (): Promise<CurrentActor | null> => {
  const session = await getCurrentSession();
  return session ? toActor(session) : null;
});
