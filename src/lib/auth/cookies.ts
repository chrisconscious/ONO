/**
 * Cookie names shared by server code, route handlers and the proxy.
 *
 * This module is intentionally dependency-free so the proxy (which runs in a
 * separate, edge-like runtime) can import it without pulling Prisma in.
 */

/** Opaque, HTTP-only session token. Never readable by client JavaScript. */
export const SESSION_COOKIE = "ono_session";

/** Remembered workspace selection. Always revalidated against memberships. */
export const WORKSPACE_COOKIE = "ono_workspace";

/** Set when a session ends so the sign-in page can explain why. */
export const SESSION_REASON_COOKIE = "ono_session_reason";

export type SessionEndReason = "expired" | "revoked" | "logout";
