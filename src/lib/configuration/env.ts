import { z } from "zod";

/**
 * Server-only environment contract.
 *
 * Parsed lazily so that importing this module never crashes builds or
 * client bundles. Call `getServerEnv()` from server code only.
 */
// Known insecure defaults that must never survive into a production boot.
const INSECURE_AUTH_SECRETS = new Set([
  "unsafe-development-secret-0123456789abcdef",
  "test-only-secret-0123456789abcdef0123456789abcdef",
]);

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    AUTH_SECRET: z
      .string()
      .min(32, "AUTH_SECRET must be at least 32 characters")
      .optional(),
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
    // Operational settings with safe non-secret defaults.
    LOG_LEVEL: z
      .enum(["debug", "info", "warn", "error"])
      .default("info"),
    APP_VERSION: z.string().default("0.1.0"),
  })
  // Production hard gate: refuse to boot with missing or default secrets so
  // misconfigured deployments fail loudly at startup instead of silently
  // running with guessable session-signing keys.
  .superRefine((cfg, ctx) => {
    if (cfg.NODE_ENV !== "production") return;
    if (!cfg.AUTH_SECRET || cfg.AUTH_SECRET.length < 32) {
      ctx.addIssue({
        code: "custom",
        message: "AUTH_SECRET (>=32 chars) is required in production",
        path: ["AUTH_SECRET"],
      });
    } else if (INSECURE_AUTH_SECRETS.has(cfg.AUTH_SECRET)) {
      ctx.addIssue({
        code: "custom",
        message: "AUTH_SECRET uses a known insecure default value",
        path: ["AUTH_SECRET"],
      });
    }
    if (/localhost|127\.0\.0\.1/.test(cfg.DATABASE_URL)) {
      ctx.addIssue({
        code: "custom",
        message: "DATABASE_URL must not point at localhost in production",
        path: ["DATABASE_URL"],
      });
    }
  });

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | undefined;

/** Clear the cache — used by tests that vary environment values per case. */
export function resetServerEnvCache(): void {
  cached = undefined;
}

export function getServerEnv(): ServerEnv {
  if (!cached) {
    cached = envSchema.parse(process.env);
  }

  return cached;
}

/**
 * Startup validation entry point (used by `npm run config:validate`).
 * Returns human-readable problems without ever echoing secret values.
 */
export function validateServerEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  const result = envSchema.safeParse(env);
  if (result.success) return [];
  return result.error.issues.map(
    (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
}
