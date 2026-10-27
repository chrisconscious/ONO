/**
 * Secret redaction utilities for operational logging.
 *
 * Application logs must never contain passwords, API tokens, private keys,
 * or connection-string credentials. These helpers are used by the structured
 * logger and can be unit-tested independently of any logging backend.
 */

// Keys whose values are always replaced with a redaction marker when they
// appear as object properties in logged metadata (case-insensitive match).
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "passwd",
  "secret",
  "authsecret",
  "token",
  "accesstoken",
  "refreshtoken",
  "apiskey",
  "apikey",
  "authorization",
  "cookie",
  "set-cookie",
  "sessiontoken",
  "invoicetoken",
  "privatetoken",
  "cardnumber",
  "cvv",
  "cvc",
  "pin",
]);

export const REDACTION_MARKER = "[REDACTED]";

function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase();
  if (SENSITIVE_KEYS.has(k)) return true;
  // Substring heuristics for compound keys such as `stripe_api_key`.
  return (
    k.includes("password") ||
    k.includes("secret") ||
    k.includes("token") ||
    k.includes("apikey") ||
    k.includes("api_key") ||
    k.includes("credential")
  );
}

/**
 * Recursively copy a value, replacing sensitive fields with a marker.
 * Handles plain objects, arrays, and primitives. Non-plain objects (Date,
 * Buffer, class instances) are passed through untouched to avoid surprises.
 */
export function redactObject<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactObject(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object" && value.constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isSensitiveKey(key) ? REDACTION_MARKER : redactObject(val);
    }
    return out as unknown as T;
  }
  return value;
}

// Patterns that appear inside free-form strings (connection URLs, bearer
// headers, key=value pairs). Applied to log messages before emission.
const STRING_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // postgres://user:pass@host — keep host, hide credentials
  {
    pattern: /(\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp)(?:s)?:\/\/)[^\s/@:]+:[^\s@/]+@/gi,
    replacement: "$1[REDACTED]@",
  },
  // Authorization: Bearer xyz / token xyz
  {
    pattern: /\b(bearer|basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi,
    replacement: "$1 [REDACTED]",
  },
  // key=value style secrets in query strings or config dumps
  {
    pattern:
      /\b(password|passwd|secret|token|api[_-]?key|access[_-]?key|auth|apikey)(\s*[=:]\s*)[^\s,"'&]+/gi,
    replacement: "$1$2[REDACTED]",
  },
];

/** Redact known secret patterns from an arbitrary log string. */
export function redactString(input: string): string {
  let out = input;
  for (const { pattern, replacement } of STRING_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
