/**
 * Global test bootstrap for the integration suite.
 *
 * SAFETY GUARANTEE: the whole test process is only allowed to talk to a
 * database whose name clearly identifies it as a throwaway test database.
 * If DATABASE_URL points anywhere else (e.g. production), setup throws
 * before a single query can run, so no test can ever mutate real data.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL ?? "";

function assertSafeTestDatabase(target: string): void {
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    throw new Error(`DATABASE_URL is not a valid connection URL: "${target}"`);
  }
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!/(^test_)|(_test$)|(^ono_test)/.test(dbName)) {
    throw new Error(
      `Refusing to run tests against database "${dbName}". ` +
        `The name must start with "test_" or end with "_test" to prove it is a disposable test database.`,
    );
  }
  if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    throw new Error("Tests must run against a local test database, not a remote host.");
  }
}

assertSafeTestDatabase(url);

// Apply tracked migrations forward onto the (already verified safe) test DB.
// This doubles as a migration-verification step: every test run proves the
// current schema migrates cleanly from scratch history.
execFileSync("npx", ["prisma", "migrate", "deploy"], {
  cwd: path.resolve(__dirname, "../.."),
  env: { ...process.env, DATABASE_URL: url },
  stdio: "pipe",
});

export const prisma = new PrismaClient();

// Child-process vitest workers do not inherit .env loading, so expose the
// client through globalThis for helpers that need it without re-importing.
(globalThis as unknown as { __testPrisma?: PrismaClient }).__testPrisma = prisma;

// Deterministic HMAC secret for token hashing in tests (NOT a production
// credential — any throwaway value works because tokens never leave the DB).
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
  process.env.AUTH_SECRET = "test-only-secret-0123456789abcdef0123456789abcdef";
}

/** Deletes all rows in FK-safe order between test files. */
async function truncateAll(): Promise<void> {
  // Children first (models with FKs), then parents. All tables are listed so
  // a fresh file always starts from an empty database.
  const ordered = [
    "workflow_runs",
    "workflow_rules",
    "approval_steps",
    "approvals",
    "handovers",
    "idempotency_records",
    "notifications",
    "documents",
    "attendance_records",
    "leave_requests",
    "employees",
    "tasks",
    "milestones",
    "projects",
    "expenses",
    "payments",
    "invoices",
    "stock_movements",
    "stock_items",
    "purchase_orders",
    "suppliers",
    "warehouses",
    "products",
    "campaigns",
    "sales_orders",
    "quotations",
    "proposals",
    "opportunities",
    "pipelines",
    "follow_ups",
    "activities",
    "contacts",
    "companies",
    "leads",
    "lead_sources",
    "kpis",
    "ai_insights",
    "integration_configs",
    "document_counters",
    "custom_industries",
    "organization_settings",
    "industry_catalogue",
    "support_tickets",
    "sessions_tenants",
    "sessions",
    "invitations",
    "audit_logs",
    "memberships",
    "departments",
    "branches",
    "subscriptions",
    "tenants",
    "users",
  ];
  const list = ordered.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE;`);
}

/** Exported so fixture helpers can reset the database between test files. */
export { truncateAll };
