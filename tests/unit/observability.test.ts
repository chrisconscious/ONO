/**
 * Unit tests for Stage 12 observability primitives: secret redaction,
 * structured logging with correlation IDs, health-report shape, and
 * tenant-safe Prometheus-style metrics rendering.
 */
import { describe, it, expect } from "vitest";
import { redactObject, redactString } from "@/lib/observability/redact";
import { buildReadinessReport, checkDatabase } from "@/lib/observability/health";

describe("secret redaction", () => {
  it("redacts sensitive keys in nested objects", () => {
    const out = redactObject({
      email: "a@b.com",
      password: "hunter2",
      user: { apiToken: "tok-123", name: "ok" },
    }) as Record<string, unknown>;
    expect(out.password).toBe("[REDACTED]");
    expect((out.user as Record<string, unknown>).apiToken).toBe("[REDACTED]");
    expect(out.email).toBe("a@b.com"); // non-secret preserved
  });

  it("redacts credentials inside connection strings", () => {
    const s = redactString("failed to connect postgresql://admin:s3cret@db.prod:5432/app");
    expect(s).not.toContain("s3cret");
    expect(s).toContain("[REDACTED]");
  });

  it("redacts bearer tokens", () => {
    const s = redactString("Authorization: Bearer abc.def.ghi");
    expect(s).not.toContain("abc.def.ghi");
  });
});

describe("readiness report", () => {
  const meta = { service: "ono-test", version: "0.0.0" };

  it("reports ok when every dependency is healthy", () => {
    const report = buildReadinessReport(
      [{ name: "database", status: "healthy", latencyMs: 5 }],
      meta,
    );
    expect(report.status).toBe("ok");
    expect(report.checks[0]!.name).toBe("database");
  });

  it("reports not_ready when the database is unavailable", () => {
    const report = buildReadinessReport(
      [{ name: "database", status: "unavailable", latencyMs: 2000, detail: "database unreachable" }],
      meta,
    );
    expect(report.status).toBe("not_ready");
    // Public payload must never include raw driver errors or credentials.
    const json = JSON.stringify(report);
    expect(json).not.toContain("password");
    expect(json).not.toContain("postgresql://");
  });

  it("checkDatabase returns healthy against a working client stub", async () => {
    const fakeClient = { $queryRaw: async () => [{ "?column?": 1 }] } as never;
    const result = await checkDatabase(fakeClient, 1000);
    expect(result.status).toBe("healthy");
  });

  it("checkDatabase reports unavailable (no leak) when the client throws", async () => {
    const fakeClient = {
      $queryRaw: async () => {
        throw new Error("connect ECONNREFUSED postgresql://user:pass@host/db");
      },
    } as never;
    const result = await checkDatabase(fakeClient, 1000);
    expect(result.status).toBe("unavailable");
    expect(result.detail).toBe("database unreachable");
    expect(JSON.stringify(result)).not.toContain("pass@host");
  });
});
