import { getCurrentSession, sessionView, toActor } from "@/lib/auth/session";
import { jsonNoStore } from "@/lib/auth/api";

export const dynamic = "force-dynamic";

/**
 * Returns the authenticated identity and current session deadlines.
 *
 * This endpoint intentionally does NOT refresh the idle timestamp. It is safe
 * for a client to ask "am I still signed in?" without keeping the session alive.
 */
export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return jsonNoStore({ authenticated: false, user: null }, { status: 401 });
    }

    const actor = toActor(session);
    const view = sessionView(session);

    return jsonNoStore({
      authenticated: true,
      user: {
        id: actor.id,
        email: actor.email,
        name: actor.name,
        role: actor.role,
        emailVerified: Boolean(actor.emailVerifiedAt),
        isPlatformAdmin: actor.isPlatformAdmin,
        memberships: actor.memberships.map((membership) => ({
          id: membership.id,
          tenantId: membership.tenantId,
          tenant: membership.tenant,
          roles: membership.roles,
        })),
      },
      session: {
        state: view.state,
        warningAt: view.warningAt.toISOString(),
        expiresAt: view.expiresAt.toISOString(),
        idleExpiresAt: view.idleExpiresAt.toISOString(),
        absoluteExpiresAt: view.absoluteExpiresAt.toISOString(),
        rememberMe: view.rememberMe,
        serverNow: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "Session status error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonNoStore(
      { authenticated: false, user: null, error: "Session status is unavailable." },
      { status: 503 },
    );
  }
}
