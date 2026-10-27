import { NextRequest, NextResponse } from "next/server";
import { ApiError, jsonError } from "@/lib/api/errors";
import { requireTenantMembership, resolveSessionIdentity } from "@/lib/auth/session";
import type { TenantContext } from "@/lib/auth/session";
import type { Permission } from "@/lib/permissions/rbac";

/**
 * Shared plumbing for tenant-scoped API route handlers.
 *
 * Security contract:
 * - The tenant is resolved ONLY from the `X-Tenant-Id` header and then
 *   validated against the authenticated session's active memberships.
 *   A client can never assume a role or membership by supplying an ID alone.
 * - Handlers receive a trusted TenantContext; services must use ctx.tenantId
 *   and never re-read request data for scoping.
 */

export interface HandlerArgs {
  ctx: TenantContext;
  request: NextRequest;
  params: Record<string, string>;
}

type Handler = (args: HandlerArgs) => Promise<Response> | Response;

async function buildContext(request: NextRequest): Promise<TenantContext> {
  const user = await resolveSessionIdentity();
  if (!user) throw ApiError.unauthorized();
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    throw ApiError.validation("Missing required X-Tenant-Id header");
  }
  // requireTenantMembership verifies ACTIVE membership + live tenant + session
  // issuance for that tenant, and derives the role server-side.
  return requireTenantMembership(user, tenantId);
}

/** Wrap a handler with auth, tenant resolution, permission check, and safe errors. */
export function withTenant(
  handler: Handler,
  options?: { permission?: Permission },
): (request: NextRequest, routeContext: { params: Promise<Record<string, string>> }) => Promise<NextResponse | Response> {
  return async (request, routeContext) => {
    try {
      const ctx = await buildContext(request);
      if (options?.permission && !ctx.permissions.has(options.permission)) {
        throw ApiError.forbidden(`Missing permission: ${options.permission}`);
      }
      const params = await routeContext.params;
      return await handler({ ctx, request, params });
    } catch (error) {
      return jsonError(error);
    }
  };
}

/** Parse a JSON body safely; malformed input becomes a 400, never a 500. */
export async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw ApiError.validation("Request body must be valid JSON");
  }
}

/** Standard list-response envelope so pagination shape is uniform everywhere. */
export function ok(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}
