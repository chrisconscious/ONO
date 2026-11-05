import type { NextRequest } from "next/server";
import { getCurrentActor, type CurrentActor } from "./session";
import { appBaseUrl } from "./urls";
import { hashToken } from "./password";

export type ApiActorResult =
  | { actor: CurrentActor; response: null }
  | { actor: null; response: { status: number; body: { error: string } } };

/**
 * Resolves the authenticated actor for a route handler. Tenant isolation and
 * platform privileges are always read from the server-side session.
 */
export async function resolveApiActor(
  options: { platformAdmin?: boolean } = {},
): Promise<ApiActorResult> {
  const actor = await getCurrentActor();

  if (!actor) {
    return {
      actor: null,
      response: { status: 401, body: { error: "Authentication required." } },
    };
  }

  if (options.platformAdmin && !actor.isPlatformAdmin) {
    return {
      actor: null,
      response: {
        status: 403,
        body: { error: "Platform administrator access is required." },
      },
    };
  }

  return { actor, response: null };
}

/** Best-effort client address. Proxies consistently prepend the real client. */
export function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    undefined
  );
}

/** Best-effort client and request metadata used by the audit trail. */
export function requestMeta(request: NextRequest) {
  return {
    ipAddress: clientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

/**
 * Origin validation for cookie-authenticated mutations.
 *
 * SameSite=Lax already stops cross-site cookies on most requests. This adds a
 * second, explicit check for browsers that send an Origin header. Requests
 * without an Origin (server-to-server clients, curl) are allowed, because they
 * cannot ride a victim's browser cookie.
 */
export function assertSameOrigin(request: NextRequest): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const allowed = new Set<string>([request.nextUrl.origin]);

  try {
    allowed.add(new URL(appBaseUrl()).origin);
  } catch {
    // appBaseUrl falls back to a valid URL, so this is defensive only.
  }

  if (allowed.has(origin)) return null;

  return jsonError(403, "This request was rejected because its origin is not allowed.");
}

export function jsonError(status: number, error: string, details?: unknown) {
  return jsonNoStore(details ? { error, details } : { error }, { status });
}

/** Auth responses must never be cached by a browser or shared proxy. */
export function jsonNoStore(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
) {
  return Response.json(body, {
    status: init.status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      ...init.headers,
    },
  });
}

/**
 * Builds a fixed-window rate-limit key. Values that may contain an email
 * address are hashed so the database never stores the address itself.
 */
export function rateLimitKey(namespace: string, ...parts: Array<string | undefined>) {
  const material = parts.map((part) => part ?? "unknown").join("|");
  return `${namespace}:${hashToken(material).slice(0, 40)}`;
}

export function tooManyRequests(retryAfterSeconds: number) {
  return jsonNoStore(
    { error: "Too many attempts. Wait a moment and try again." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, retryAfterSeconds)) },
    },
  );
}
