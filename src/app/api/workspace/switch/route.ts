import type { NextRequest } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { getCurrentActor } from "@/lib/auth/session";
import { WORKSPACE_COOKIE } from "@/lib/auth/guards";
import { assertSameOrigin, jsonError, jsonNoStore } from "@/lib/auth/api";

const switchSchema = z.object({ tenantId: z.string().min(1) });

/**
 * Persists the actor's active workspace. Only tenants the actor is an active
 * member of can be selected; the browser never supplies authorization.
 */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const actor = await getCurrentActor();
  if (!actor) {
    return jsonError(401, "Authentication required.");
  }

  const parsed = switchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, "Select a valid workspace.");
  }

  const membership = actor.memberships.find(
    (item) => item.tenantId === parsed.data.tenantId,
  );

  if (!membership) {
    return jsonError(403, "You are not a member of that workspace.");
  }

  if (
    membership.tenant.status === "SUSPENDED" ||
    membership.tenant.status === "CLOSED"
  ) {
    return jsonError(403, "That workspace is not available.");
  }

  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, membership.tenantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return jsonNoStore({
    tenant: { id: membership.tenantId, name: membership.tenant.name },
  });
}
