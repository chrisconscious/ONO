import type { NextRequest } from "next/server";
import { getCurrentActor, type CurrentActor } from "./session";

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

/** Best-effort client and request metadata used by the audit trail. */
export function requestMeta(request: NextRequest) {
  return {
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

export function jsonError(status: number, error: string, details?: unknown) {
  return Response.json(details ? { error, details } : { error }, { status });
}
