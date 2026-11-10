import type { CurrentActor } from "./session";

/** Canonical "return to work" destination for an authenticated account. */
export function accountHomeHref(actor: CurrentActor) {
  if (actor.isPlatformAdmin) return "/admin";
  if (actor.memberships.length > 0) return "/app";
  return "/sign-in";
}

/** Human label shown under the user's name in the profile menu. */
export function accountRoleLabel(actor: CurrentActor) {
  if (actor.isPlatformAdmin) return "Platform administrator";
  const roles = Array.from(
    new Set(actor.memberships.flatMap((membership) => membership.roles)),
  );
  return roles.length > 0 ? roles.join(", ") : "Workspace member";
}

/**
 * Cache-busting URL for the owner's avatar. The endpoint requires the session
 * cookie, so this is only ever rendered inside authenticated pages.
 */
export function accountAvatarUrl(updatedAt: Date | null | undefined) {
  return updatedAt
    ? `/api/auth/account/avatar?v=${updatedAt.getTime()}`
    : null;
}

export function accountInitials(name: string | null, email: string) {
  const source = (name ?? "").trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}
