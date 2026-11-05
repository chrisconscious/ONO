/**
 * Session lifetime policy.
 *
 * Every value is configurable through the environment so a deployment can
 * tighten or relax the defaults without a code change. The policy is applied
 * on the server; the browser only displays a countdown derived from it.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type SessionPolicy = {
  /** Inactivity allowed before the session is rejected. */
  idleMs: number;
  /** Hard ceiling for a standard session, regardless of activity. */
  absoluteMs: number;
  /** How long before expiry the warning is shown. */
  warningMs: number;
  /** Inactivity allowed for a session created with "remember me". */
  rememberIdleMs: number;
  /** Hard ceiling for a remembered session. */
  rememberAbsoluteMs: number;
  /**
   * Minimum gap between idle-timestamp writes. This is the server-side rate
   * limit that stops request floods from keeping a session alive.
   */
  touchIntervalMs: number;
};

export const DEFAULT_SESSION_POLICY: SessionPolicy = {
  idleMs: 30 * MINUTE,
  absoluteMs: 12 * HOUR,
  warningMs: 2 * MINUTE,
  rememberIdleMs: 7 * DAY,
  rememberAbsoluteMs: 30 * DAY,
  touchIntervalMs: 60_000,
};

type EnvLike = Record<string, string | undefined>;

function readNumber(
  env: EnvLike,
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = env[name];
  if (raw === undefined || raw.trim() === "") return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;

  return Math.min(max, Math.max(min, value));
}

/**
 * Resolves the active policy. Values are clamped so a typo cannot produce a
 * session that never expires or a warning that appears after expiry.
 */
export function resolveSessionPolicy(
  env: EnvLike = process.env,
): SessionPolicy {
  const idleMinutes = readNumber(env, "SESSION_IDLE_MINUTES", 30, 1, 24 * 60);
  const absoluteHours = readNumber(
    env,
    "SESSION_ABSOLUTE_HOURS",
    12,
    1,
    24 * 30,
  );
  const warningMinutes = readNumber(
    env,
    "SESSION_WARNING_MINUTES",
    2,
    0,
    Math.max(0, idleMinutes - 1),
  );
  const rememberIdleDays = readNumber(
    env,
    "SESSION_REMEMBER_IDLE_DAYS",
    7,
    1,
    90,
  );
  const rememberAbsoluteDays = readNumber(
    env,
    "SESSION_REMEMBER_ABSOLUTE_DAYS",
    30,
    1,
    365,
  );
  const touchSeconds = readNumber(env, "SESSION_TOUCH_SECONDS", 60, 10, 600);

  const idleMs = idleMinutes * MINUTE;
  const absoluteMs = Math.max(idleMs, absoluteHours * HOUR);
  const rememberIdleMs = Math.max(idleMs, rememberIdleDays * DAY);
  const rememberAbsoluteMs = Math.max(
    rememberIdleMs,
    rememberAbsoluteDays * DAY,
  );

  return {
    idleMs,
    absoluteMs,
    warningMs: warningMinutes * MINUTE,
    rememberIdleMs,
    rememberAbsoluteMs,
    touchIntervalMs: touchSeconds * 1000,
  };
}

export function policyWindow(policy: SessionPolicy, rememberMe: boolean) {
  return rememberMe
    ? { idleMs: policy.rememberIdleMs, absoluteMs: policy.rememberAbsoluteMs }
    : { idleMs: policy.idleMs, absoluteMs: policy.absoluteMs };
}

/** Minimal session shape needed to evaluate a session window. */
export type SessionTiming = {
  createdAt: Date;
  lastActivityAt: Date | null;
  expiresAt: Date;
  absoluteExpiresAt: Date | null;
  rememberMe: boolean;
};

export type SessionWindow = {
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  /** The earlier of the two deadlines: when the session actually dies. */
  expiresAt: Date;
  warningAt: Date;
  remainingMs: number;
};

function addMs(date: Date, ms: number) {
  return new Date(date.getTime() + ms);
}

function earliest(a: Date, b: Date) {
  return a.getTime() <= b.getTime() ? a : b;
}

export function idleDeadline(
  session: SessionTiming,
  policy: SessionPolicy,
): Date {
  const lastActivity = session.lastActivityAt ?? session.createdAt;
  return addMs(lastActivity, policyWindow(policy, session.rememberMe).idleMs);
}

export function absoluteDeadline(
  session: SessionTiming,
): Date {
  return session.absoluteExpiresAt ?? session.expiresAt;
}

export function sessionWindow(
  session: SessionTiming,
  policy: SessionPolicy,
  now: Date = new Date(),
): SessionWindow {
  const idleExpiresAt = idleDeadline(session, policy);
  const absoluteExpiresAt = absoluteDeadline(session);
  const expiresAt = earliest(idleExpiresAt, absoluteExpiresAt);
  const warningAt = new Date(
    Math.max(
      session.lastActivityAt?.getTime() ?? session.createdAt.getTime(),
      expiresAt.getTime() - policy.warningMs,
    ),
  );

  return {
    idleExpiresAt,
    absoluteExpiresAt,
    expiresAt,
    warningAt,
    remainingMs: expiresAt.getTime() - now.getTime(),
  };
}

export type SessionState = "active" | "warning" | "expired";

export function sessionState(
  session: SessionTiming,
  policy: SessionPolicy,
  now: Date = new Date(),
): SessionState {
  const window = sessionWindow(session, policy, now);
  if (window.remainingMs <= 0) return "expired";
  if (now.getTime() >= window.warningAt.getTime()) return "warning";
  return "active";
}

/** Deadlines assigned to a brand-new session. */
export function newSessionWindow(
  policy: SessionPolicy,
  rememberMe: boolean,
  now: Date = new Date(),
) {
  const { idleMs, absoluteMs } = policyWindow(policy, rememberMe);
  const absoluteExpiresAt = addMs(now, absoluteMs);

  return {
    lastActivityAt: now,
    absoluteExpiresAt,
    expiresAt: earliest(addMs(now, idleMs), absoluteExpiresAt),
  };
}

/**
 * Deadlines after an authenticated activity tick. The idle deadline moves
 * forward, but never past the absolute deadline, so activity cannot extend a
 * session indefinitely.
 */
export function touchedWindow(
  session: SessionTiming,
  policy: SessionPolicy,
  now: Date = new Date(),
) {
  const absolute = absoluteDeadline(session);
  const idle = addMs(now, policyWindow(policy, session.rememberMe).idleMs);
  const expiresAt = earliest(idle, absolute);

  return { lastActivityAt: now, expiresAt };
}

/** True when the throttle window has elapsed and activity should be recorded. */
export function shouldTouch(
  session: SessionTiming,
  policy: SessionPolicy,
  now: Date = new Date(),
) {
  const last = session.lastActivityAt ?? session.createdAt;
  return now.getTime() - last.getTime() >= policy.touchIntervalMs;
}
