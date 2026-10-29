import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/auth/api";
import { getCurrentActor } from "@/lib/auth/session";
import {
  getActorContext,
  hasPermission,
  type ActorContext,
} from "@/lib/permissions/authorize";
import type { CurrentActor, TenantMembership } from "@/lib/auth/session";

export type TenantApiSuccess = {
  error: null;
  actor: CurrentActor;
  membership: TenantMembership;
  context: ActorContext;
  tenantId: string;
};

export type TenantApiFailure = { error: Response };

const blockedStatuses = new Set(["SUSPENDED", "CLOSED"]);

/**
 * Resolves the authenticated tenant context for a route handler.
 *
 * The active tenant always comes from the session and workspace cookie, never
 * from the request body. The required permission is checked against the
 * membership that owns the active workspace.
 */
export async function requireTenantApi(
  permission?: string,
): Promise<TenantApiSuccess | TenantApiFailure> {
  const actor = await getCurrentActor();
  if (!actor) return { error: jsonError(401, "Authentication required.") };

  const context = await getActorContext(actor.id);
  if (!context.tenantId) {
    return { error: jsonError(403, "An active workspace membership is required.") };
  }

  const membership = actor.memberships.find(
    (item) => item.tenantId === context.tenantId,
  );
  if (!membership) {
    return { error: jsonError(403, "An active workspace membership is required.") };
  }

  if (blockedStatuses.has(membership.tenant.status)) {
    return { error: jsonError(403, "This workspace is not accepting changes.") };
  }

  if (permission && !hasPermission(context, permission)) {
    return { error: jsonError(403, "Your workspace role does not allow this action.") };
  }

  return {
    error: null,
    actor,
    membership,
    context,
    tenantId: context.tenantId,
  };
}

/** Parses page and limit query parameters with defensive bounds. */
export function readPagination(request: NextRequest, defaultLimit = 20) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

/** Converts Prisma decimals and dates into JSON-friendly primitives. */
export function serialise<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
