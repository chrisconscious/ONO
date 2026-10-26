import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/configuration/env";

/**
 * Cryptographically random opaque tokens for sessions and invitations.
 * Only hashes of these tokens are persisted server-side.
 */
export function generateOpaqueToken(byteLength = 32): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(byteLength).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

/** SHA-256 with a keyed HMAC using AUTH_SECRET so DB leaks don't reveal raw-token equivalence. */
export function hashToken(token: string): string {
  const secret = getServerEnv().AUTH_SECRET ?? "unsafe-development-secret-0123456789abcdef";
  return createHmac("sha256", secret).update(token).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}
