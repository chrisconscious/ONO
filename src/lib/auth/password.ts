import { hash, verify } from "@node-rs/argon2";

/**
 * Password hashing (Argon2id via @node-rs/argon2).
 * Parameters follow OWASP guidance; the hash string embeds them.
 */
const ARGON_OPTIONS = {
  memoryCost: 19456, // ~19 MiB
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON_OPTIONS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
