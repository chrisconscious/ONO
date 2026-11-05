import { isSafeInternalPath } from "./redirect";

/**
 * Destination policy after a successful sign-in.
 *
 * A requested path is honoured only when it is app-relative and the actor is
 * plausibly authorised for it. Guards still enforce every rule on the server;
 * this function exists to avoid sending a user into a redirect loop.
 */

type DestinationActor = {
  isPlatformAdmin: boolean;
  memberships: Array<{ tenantId: string }>;
};

const authPaths = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/session-expired",
];

export function defaultDestination(actor: DestinationActor): string {
  if (actor.memberships.length > 0) return "/app";
  if (actor.isPlatformAdmin) return "/admin";
  return "/access-denied?scope=workspace";
}

function pathnameOf(value: string) {
  return value.split(/[?#]/, 1)[0] ?? value;
}

export function resolvePostAuthDestination(
  actor: DestinationActor,
  requested: string | undefined,
): string {
  if (!isSafeInternalPath(requested)) return defaultDestination(actor);

  const pathname = pathnameOf(requested);

  // Never bounce back to an authentication screen after signing in.
  if (authPaths.some((path) => pathname === path)) {
    return defaultDestination(actor);
  }

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return actor.memberships.length > 0
      ? requested
      : defaultDestination(actor);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return actor.isPlatformAdmin ? requested : defaultDestination(actor);
  }

  return requested;
}
