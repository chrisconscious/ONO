import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

/**
 * Vitest configuration.
 *
 * - `tests/unit`      : pure logic tests, no database required.
 * - `tests/integration`: require the local disposable PostgreSQL test DB;
 *   guarded by tests/vitest.setup.ts which refuses any non-test database name.
 * - `tests/e2e`       : reserved for HTTP-level tests once API routes exist
 *   (excluded until then so the suite stays deterministic).
 */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
    // Integration tests share one database and must not interleave files.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    setupFiles: [path.resolve(__dirname, "tests/helpers/integration.ts")],
    env: {
      // Explicitly point application code at the disposable test database so
      // no test can ever touch the development/production `ono` database.
      NODE_ENV: "test",
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        "postgresql://postgres:postgres@localhost:5432/ono_test?schema=public",
      AUTH_SECRET: "test-only-secret-0123456789abcdef0123456789abcdef",
    },
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
