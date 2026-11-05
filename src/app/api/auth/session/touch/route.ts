import type { NextRequest } from "next/server";
import {
  getCurrentSession,
  sessionView,
  touchSession,
} from "@/lib/auth/session";
import {
  assertSameOrigin,
  jsonError,
  jsonNoStore,
} from "@/lib/auth/api";

export const dynamic = "force-dynamic";

/**
 * Explicit "continue session" action.
 *
 * Only called when the user answers the expiry warning. Ordinary page loads
 * refresh activity through the guards; background tabs never poll this route.
 */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const session = await getCurrentSession();
    if (!session) {
      return jsonError(401, "Your session has ended. Sign in again.");
    }

    const now = new Date();
    const window = await touchSession(session, now, { force: true });
    const view = sessionView(session, now);

    return jsonNoStore({
      ok: true,
      session: {
        state: view.state,
        warningAt: window.warningAt.toISOString(),
        expiresAt: window.expiresAt.toISOString(),
        idleExpiresAt: window.idleExpiresAt.toISOString(),
        absoluteExpiresAt: window.absoluteExpiresAt.toISOString(),
        rememberMe: session.rememberMe,
        serverNow: now.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "Session touch error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(503, "The session could not be extended. Please try again.");
  }
}
