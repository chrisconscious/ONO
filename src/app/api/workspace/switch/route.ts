import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { getCurrentActor } from "@/lib/auth/session";
import { WORKSPACE_COOKIE } from "@/lib/auth/guards";

const switchSchema = z.object({ tenantId: z.string().min(1) });

/**
 * Persists the actor's active workspace. Only tenants the actor is an active
 * member of can be selected.
 */
export async function POST(request: Request) {
  const actor = await getCurrentActor();
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = switchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Select a valid workspace." }, { status: 400 });
  }

  const membership = actor.memberships.find(
    (item) => item.tenantId === parsed.data.tenantId,
  );

  if (!membership) {
    return NextResponse.json(
      { error: "You are not a member of that workspace." },
      { status: 403 },
    );
  }

  if (membership.tenant.status === "SUSPENDED" || membership.tenant.status === "CLOSED") {
    return NextResponse.json(
      { error: "That workspace is not available." },
      { status: 403 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, membership.tenantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({
    tenant: { id: membership.tenantId, name: membership.tenant.name },
  });
}
