"use client";

/**
 * Cross-tab session signals.
 *
 * The browser storage event only reaches other tabs, so a sign-out in one tab
 * immediately ends the visible session in every other tab without a heartbeat.
 * The values are intentionally non-sensitive: no token, email or identifier is
 * written to localStorage.
 */

export const SESSION_EVENT_KEY = "ono:session-event";

export type SessionEvent =
  | { type: "ended"; at: number }
  | { type: "extended"; expiresAt: string; warningAt: string; serverNow: string };

export function broadcastSessionEvent(event: SessionEvent) {
  try {
    window.localStorage.setItem(SESSION_EVENT_KEY, JSON.stringify(event));
  } catch {
    // Storage can be unavailable in private modes. The server remains the
    // source of truth, so a failed broadcast is not fatal.
  }
}

/** Announces that the session ended in this tab. */
export function notifySignedOut() {
  broadcastSessionEvent({ type: "ended", at: Date.now() });
}

/** Announces that another tab extended the session. */
export function notifySessionExtended(session: {
  expiresAt: string;
  warningAt: string;
  serverNow: string;
}) {
  broadcastSessionEvent({ type: "extended", ...session });
}

export function parseSessionEvent(value: string | null): SessionEvent | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<SessionEvent>;
    if (parsed.type === "ended" && typeof parsed.at === "number") {
      return { type: "ended", at: parsed.at };
    }
    if (
      parsed.type === "extended" &&
      typeof parsed.expiresAt === "string" &&
      typeof parsed.warningAt === "string" &&
      typeof parsed.serverNow === "string"
    ) {
      return {
        type: "extended",
        expiresAt: parsed.expiresAt,
        warningAt: parsed.warningAt,
        serverNow: parsed.serverNow,
      };
    }
  } catch {
    return null;
  }

  return null;
}

/** Runs the handler when another tab ends the session. */
export function onSignedOut(handler: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key !== SESSION_EVENT_KEY) return;
    if (parseSessionEvent(event.newValue)?.type === "ended") handler();
  };

  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

/** Runs the handler when another tab extends the session. */
export function onSessionExtended(
  handler: (session: {
    expiresAt: string;
    warningAt: string;
    serverNow: string;
  }) => void,
) {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key !== SESSION_EVENT_KEY) return;
    const parsed = parseSessionEvent(event.newValue);
    if (parsed?.type === "extended") handler(parsed);
  };

  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

/** Only internal paths are used for post-expiry return links. */
export function currentInternalPath() {
  const path = `${window.location.pathname}${window.location.search}`;
  return path.startsWith("/") && !path.startsWith("//") ? path : undefined;
}
