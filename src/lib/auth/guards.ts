import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getCurrentSession,
  getCurrentActor,
  sessionView,
  toActor,
  touchSession,
  type CurrentActor,
  type SessionWithUser,
  type TenantMembership,
} from "./session";
import { SESSION_COOKIE, WORKSPACE_COOKIE } from "./cookies";
import { isSafeInternalPath } from "./redirect";
import type { SessionState, SessionWindow } from "./policy";

export { WORKSPACE_COOKIE };

export const SIGN_IN_PATH = "/sign-in";

/** Cookie that remembers which workspace the actor last selected. */
const blockedTenantStatuses = new Set(["SUSPENDED", "CLOSED"]);

export type RequestSessionView = SessionWindow & {
  state: SessionState;
  rememberMe: boolean;
};

/**
 * Redirects to the canonical sign-in route while preserving where the visitor
 * was going. Only app-relative paths are accepted.
 */
export function signInRedirectPath(
  from: string,
  reason?: "expired" | "signed-out",
) {
  const params = new URLSearchParams();
  if (isSafeInternalPath(from)) params.set("next", from);
  if (reason) params.set("reason", reason);
  const query = params.toString();
  return query ? `${SIGN_IN_PATH}?${query}` : SIGN_IN_PATH;
}

function withState(
  session: SessionWithUser,
  window: SessionWindow,
  now: Date,
): RequestSessionView {
  return {
    ...window,
    state:
      window.remainingMs <= 0
        ? "expired"
        : now.getTime() >= window.warningAt.getTime()
          ? "warning"
          : "active",
    rememberMe: session.rememberMe,
  };
}

/**
 * Requires an authenticated session.
 *
 * The session is validated against the database (revocation, idle deadline,
 * absolute deadline, account status, email verification) and meaningful page
 * activity refreshes the idle timestamp subject to a server-side throttle.
 */
export async function requireSession(from: string) {
  const session = await getCurrentSession();

  if (!session) {
    const cookieStore = await cookies();
    const hadCookie = Boolean(cookieStore.get(SESSION_COOKIE)?.value);
    redirect(signInRedirectPath(from, hadCookie ? "expired" : undefined));
  }

  const now = new Date();
  const window = await touchSession(session, now);

  return {
    session,
    actor: toActor(session, now),
    view: withState(session, window, now),
    now,
  };
}

/**
 * Requires a platform administrator. Platform privilege is read from the
 * server-side user record, never from client state or the URL.
 */
export async function requirePlatformAdmin(from: string) {
  const context = await requireSession(from);

  if (!context.actor.isPlatformAdmin) {
    redirect("/access-denied?scope=platform");
  }

  return context;
}

/** Session view for a page that has already resolved the session. */
export function viewOf(session: SessionWithUser, now: Date = new Date()) {
  return sessionView(session, now);
}

export type WorkspaceContext = {
  session: SessionWithUser;
  actor: CurrentActor;
  membership: TenantMembership;
  view: RequestSessionView;
  now: Date;
};

/**
 * Requires an authenticated user with an active tenant membership.
 *
 * Platform administrators without a membership are redirected to their console
 * instead of being given implicit access to tenant data.
 *
 * The active workspace comes from the explicit request (when provided) or the
 * workspace cookie, and is always validated against the actor's memberships.
 */
export async function requireWorkspace(
  from: string,
  requestedTenantId?: string,
): Promise<WorkspaceContext> {
  const context = await requireSession(from);
  const { actor } = context;

  const memberships = actor.memberships;
  if (memberships.length === 0) {
    if (actor.isPlatformAdmin) {
      redirect("/admin");
    }
    redirect("/access-denied?scope=workspace");
  }

  const cookieStore = await cookies();
  const preferredTenantId =
    requestedTenantId ?? cookieStore.get(WORKSPACE_COOKIE)?.value ?? undefined;

  const usable = memberships.filter(
    (membership) => !blockedTenantStatuses.has(membership.tenant.status),
  );

  // A remembered workspace that became suspended must not block access to
  // another workspace the user still belongs to.
  const membership =
    usable.find((item) => item.tenantId === preferredTenantId) ??
    usable[0] ??
    memberships[0];

  if (blockedTenantStatuses.has(membership.tenant.status)) {
    redirect("/access-denied?scope=suspended");
  }

  return { ...context, membership };
}

/** True when the membership grants the permission code (supports wildcards). */
export function can(membership: TenantMembership, permission: string) {
  return (
    membership.permissions.includes("*") ||
    membership.permissions.includes(permission)
  );
}

/** Returns true when at least one of the permissions is granted. */
export function canAny(membership: TenantMembership, permissions: string[]) {
  return permissions.some((permission) => can(membership, permission));
}

export { getCurrentActor };
