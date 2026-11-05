import { describe, expect, it } from "vitest";
import {
  DEFAULT_SESSION_POLICY,
  newSessionWindow,
  resolveSessionPolicy,
  sessionState,
  sessionWindow,
  touchedWindow,
  type SessionTiming,
} from "./policy";

const start = new Date("2026-10-30T12:00:00.000Z");

function session(overrides: Partial<SessionTiming> = {}): SessionTiming {
  return {
    createdAt: start,
    lastActivityAt: start,
    expiresAt: new Date(start.getTime() + DEFAULT_SESSION_POLICY.idleMs),
    absoluteExpiresAt: new Date(
      start.getTime() + DEFAULT_SESSION_POLICY.absoluteMs,
    ),
    rememberMe: false,
    ...overrides,
  };
}

describe("session policy", () => {
  it("uses the documented idle, absolute, and warning defaults", () => {
    expect(DEFAULT_SESSION_POLICY.idleMs).toBe(30 * 60_000);
    expect(DEFAULT_SESSION_POLICY.absoluteMs).toBe(12 * 60 * 60_000);
    expect(DEFAULT_SESSION_POLICY.warningMs).toBe(2 * 60_000);
  });

  it("clamps configuration values to safe bounds", () => {
    expect(
      resolveSessionPolicy({
        SESSION_IDLE_MINUTES: "0",
        SESSION_ABSOLUTE_HOURS: "9999",
        SESSION_WARNING_MINUTES: "9999",
      }),
    ).toMatchObject({
      idleMs: 60_000,
      absoluteMs: 30 * 24 * 60 * 60_000,
      warningMs: 0,
    });
  });

  it("limits a new session to both its idle and absolute deadlines", () => {
    const window = newSessionWindow(DEFAULT_SESSION_POLICY, false, start);
    expect(window.expiresAt).toEqual(
      new Date(start.getTime() + DEFAULT_SESSION_POLICY.idleMs),
    );
    expect(window.absoluteExpiresAt).toEqual(
      new Date(start.getTime() + DEFAULT_SESSION_POLICY.absoluteMs),
    );
  });

  it("never extends the absolute deadline when activity refreshes idle time", () => {
    const absoluteExpiresAt = new Date(start.getTime() + 60 * 60_000);
    const existing = session({ absoluteExpiresAt });
    const now = new Date(start.getTime() + 55 * 60_000);
    const touched = touchedWindow(existing, DEFAULT_SESSION_POLICY, now);

    expect(touched.lastActivityAt).toEqual(now);
    expect(touched.expiresAt).toEqual(absoluteExpiresAt);
  });

  it("warns before the effective deadline and rejects expired sessions", () => {
    const current = session();
    const warningAt = new Date(
      current.expiresAt.getTime() - DEFAULT_SESSION_POLICY.warningMs,
    );

    expect(sessionState(current, DEFAULT_SESSION_POLICY, warningAt)).toBe("warning");
    expect(
      sessionState(
        current,
        DEFAULT_SESSION_POLICY,
        new Date(current.expiresAt.getTime()),
      ),
    ).toBe("expired");
  });

  it("derives the idle deadline from the last recorded activity", () => {
    const lastActivityAt = new Date(start.getTime() + 10 * 60_000);
    const current = session({ lastActivityAt });
    const window = sessionWindow(current, DEFAULT_SESSION_POLICY, start);

    expect(window.idleExpiresAt).toEqual(
      new Date(lastActivityAt.getTime() + DEFAULT_SESSION_POLICY.idleMs),
    );
  });
});
