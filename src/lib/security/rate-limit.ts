/**
 * In-memory fixed-window rate limiter. Suitable for single-instance dev/test;
 * production deployments should back this with Redis or similar.
 */
interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }
  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/** Sign-in protection: max 10 attempts per IP+email per 15 minutes. */
export function enforceSignInRateLimit(ip: string, email: string): RateLimitResult {
  return checkRateLimit(`signin:${ip}:${email.toLowerCase()}`, 10, 15 * 60 * 1000);
}

/** Generic API abuse protection: 300 requests per IP per minute. */
export function enforceApiRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`api:${ip}`, 300, 60 * 1000);
}

export function __resetRateLimitsForTesting(): void {
  windows.clear();
}
