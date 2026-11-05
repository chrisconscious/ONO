import { getCurrentSession, listUserSessions } from "@/lib/auth/session";
import { jsonError, jsonNoStore } from "@/lib/auth/api";
import { describeUserAgent } from "@/lib/auth/device";

export const dynamic = "force-dynamic";

/**
 * Lists active sessions for the account security screen.
 *
 * Only non-sensitive metadata is returned. The token hash is never selected,
 * and the current session is identified by id for "this device" labelling.
 */
export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) return jsonError(401, "Authentication required.");

    const sessions = await listUserSessions(session.user.id);

    return jsonNoStore({
      sessions: sessions.map((item) => ({
        id: item.id,
        device: describeUserAgent(item.userAgent),
        ipAddress: item.ipAddress ?? null,
        createdAt: item.createdAt.toISOString(),
        lastActivityAt: item.lastActivityAt?.toISOString() ?? null,
        expiresAt: item.expiresAt.toISOString(),
        rememberMe: item.rememberMe,
        current: item.id === session.id,
      })),
    });
  } catch (error) {
    console.error(
      "Session list error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(503, "Active sessions are unavailable right now.");
  }
}
