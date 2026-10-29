import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getCurrentActor,
  getCurrentSession,
  toActor,
  type CurrentActor,
  type TenantMembership,
} from "./session";

/** Cookie that remembers which workspace the actor last selected. */
export const WORKSPACE_COOKIE = "ono_workspace";

const blockedTenantStatuses = new Set(["SUSPENDED", "CLOSED"]);


/** Redirects path that preserves where the user was trying to go. */
export function loginRedirectPath(from: string) {
  const params = new URLSearchParams({ next: from });
  return `/login?${params.toString()}`;
}

/**
 * Requires an authenticated session. Unauthenticated visitors are sent to the
 * login screen with a return path.
 */
export async function requireSession(from: string) {
  const session = await getCurrentSession();
  if (!session) {
    redirect(loginRedirectPath(from));
  }

  return { session, actor: toActor(session) };
}

/**
 * Requires a platform administrator. Platform privilege is read from the
 * server-side user record, never from client state or the URL.
 */
export async function requirePlatformAdmin(from: string): Promise<CurrentActor> {
  const { actor } = await requireSession(from);

  if (!actor.isPlatformAdmin) {
    redirect("/access-denied?scope=platform");
  }

  return actor;
}

export type WorkspaceContext = {
  actor: CurrentActor;
  membership: TenantMembership;
};

/**
 * Requires an authenticated user with an active tenant membership.
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
  const { actor } = await requireSession(from);

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

  const membership =
    memberships.find((item) => item.tenantId === preferredTenantId) ??
    memberships[0];

  if (blockedTenantStatuses.has(membership.tenant.status)) {
    redirect("/access-denied?scope=suspended");
  }

  return { actor, membership };
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
