import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";

/**
 * Database-backed fixed-window throttling.
 *
 * Counters live in PostgreSQL rather than process memory so limits hold across
 * every server instance and survive a restart. Keys are hashed by the caller
 * when they contain an email address.
 */

export type RateLimitOptions = {
  /** Maximum attempts allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** How long to block once the limit is exceeded. */
  blockMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export async function consumeRateLimit(
  key: string,
  options: RateLimitOptions,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const { limit, windowMs, blockMs } = options;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const bucket = await tx.rateLimitBucket.findUnique({ where: { key } });

        if (!bucket || bucket.resetAt.getTime() <= now.getTime()) {
          await tx.rateLimitBucket.upsert({
            where: { key },
            create: {
              key,
              count: 1,
              resetAt: new Date(now.getTime() + windowMs),
            },
            update: {
              count: 1,
              resetAt: new Date(now.getTime() + windowMs),
              blockedUntil: null,
            },
          });

          return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
        }

        if (bucket.blockedUntil && bucket.blockedUntil.getTime() > now.getTime()) {
          return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: Math.ceil(
              (bucket.blockedUntil.getTime() - now.getTime()) / 1000,
            ),
          };
        }

        const count = bucket.count + 1;

        if (count > limit) {
          const blockedUntil = new Date(now.getTime() + blockMs);
          await tx.rateLimitBucket.update({
            where: { key },
            data: { count, blockedUntil },
          });

          return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: Math.ceil(blockMs / 1000),
          };
        }

        await tx.rateLimitBucket.update({
          where: { key },
          data: { count },
        });

        return {
          allowed: true,
          remaining: Math.max(0, limit - count),
          retryAfterSeconds: 0,
        };
      });
    } catch (error) {
      // Concurrent first writes can race on the primary key. Retrying once is
      // enough because the second attempt always finds the row.
      if (
        attempt === 0 &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Rate limit could not be evaluated.");
}

/** Clears a counter after a successful authentication. */
export async function clearRateLimit(key: string) {
  await prisma.rateLimitBucket.deleteMany({ where: { key } }).catch(() => undefined);
}

/** Best-effort removal of expired counters. */
export async function pruneRateLimits(now: Date = new Date()) {
  await prisma.rateLimitBucket
    .deleteMany({
      where: { resetAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    })
    .catch(() => undefined);
}

/** Fixed limits used by the authentication endpoints. */
export const AUTH_RATE_LIMITS = {
  signIn: { limit: 8, windowMs: 15 * 60_000, blockMs: 15 * 60_000 },
  signUp: { limit: 5, windowMs: 60 * 60_000, blockMs: 60 * 60_000 },
  forgotPassword: { limit: 5, windowMs: 60 * 60_000, blockMs: 60 * 60_000 },
  resetPassword: { limit: 10, windowMs: 60 * 60_000, blockMs: 60 * 60_000 },
  verifyEmail: { limit: 10, windowMs: 60 * 60_000, blockMs: 60 * 60_000 },
  resendVerification: { limit: 3, windowMs: 60 * 60_000, blockMs: 60 * 60_000 },
} satisfies Record<string, RateLimitOptions>;
