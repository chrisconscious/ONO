import type { AuthTokenType } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { generateToken, hashToken } from "./password";

/**
 * Token lifetimes. Password reset links are short-lived; verification links
 * live long enough for a mailbox owner to act on them.
 */
export const AUTH_TOKEN_TTL_MS: Record<AuthTokenType, number> = {
  PASSWORD_RESET: 60 * 60 * 1000,
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
};

/**
 * Issues a single-use token and returns the raw value exactly once. Only the
 * SHA-256 hash is stored, so a database leak cannot be replayed as a link.
 * Previously issued tokens of the same type are discarded.
 */
export async function issueAuthToken(params: {
  userId: string;
  type: AuthTokenType;
  ttlMs?: number;
  now?: Date;
}): Promise<{ token: string; expiresAt: Date }> {
  const now = params.now ?? new Date();
  const ttlMs = params.ttlMs ?? AUTH_TOKEN_TTL_MS[params.type];
  const expiresAt = new Date(now.getTime() + ttlMs);
  const token = generateToken(32);
  const tokenHash = hashToken(token);

  await prisma.$transaction([
    prisma.authToken.deleteMany({
      where: { userId: params.userId, type: params.type, usedAt: null },
    }),
    prisma.authToken.create({
      data: {
        userId: params.userId,
        type: params.type,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  return { token, expiresAt };
}

/**
 * Atomically consumes a token. A second use of the same link finds `usedAt`
 * already set and is rejected, which prevents replay.
 */
export async function consumeAuthToken(
  rawToken: string,
  type: AuthTokenType,
  now: Date = new Date(),
): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(rawToken);

  const token = await prisma.authToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, type: true, usedAt: true, expiresAt: true },
  });

  if (!token || token.type !== type) return null;
  if (token.usedAt || token.expiresAt.getTime() <= now.getTime()) return null;

  const consumed = await prisma.authToken.updateMany({
    where: { id: token.id, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });

  return consumed.count === 1 ? { userId: token.userId } : null;
}

/** Removes unused tokens of a type, for example after a password change. */
export async function invalidateAuthTokens(
  userId: string,
  type: AuthTokenType,
) {
  await prisma.authToken.deleteMany({ where: { userId, type, usedAt: null } });
}

/** Housekeeping for expired rows. Safe to call opportunistically. */
export async function pruneAuthTokens(now: Date = new Date()) {
  await prisma.authToken
    .deleteMany({ where: { expiresAt: { lt: now } } })
    .catch(() => undefined);
}

export type AuthTokenStatus = "valid" | "invalid" | "used" | "expired";

/**
 * Reads a token without consuming it, so a page can explain whether a link is
 * still usable. Verification and reset both require a later explicit POST.
 */
export async function peekAuthToken(
  rawToken: string,
  type: AuthTokenType,
  now: Date = new Date(),
): Promise<AuthTokenStatus> {
  const token = await prisma.authToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    select: { type: true, usedAt: true, expiresAt: true },
  });

  if (!token || token.type !== type) return "invalid";
  if (token.usedAt) return "used";
  if (token.expiresAt.getTime() <= now.getTime()) return "expired";
  return "valid";
}
