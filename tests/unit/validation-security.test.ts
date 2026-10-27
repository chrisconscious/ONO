/**
 * Unit tests for validation schemas and security primitives that do not
 * require a database.
 */
import { describe, expect, it, beforeEach } from "vitest";
import { ZodError } from "zod";
import {
  createInvoiceSchema,
  paginationQuerySchema,
  registerSchema,
  signInSchema,
  stockMovementSchema,
} from "@/lib/validation/schemas";
import { checkRateLimit, __resetRateLimitsForTesting } from "@/lib/security/rate-limit";
import { generateOpaqueToken, hashToken, safeEqualHex } from "@/lib/auth/tokens";

describe("pagination query schema", () => {
  it("applies safe defaults", () => {
    const q = paginationQuerySchema.parse({});
    expect(q.page).toBe(1);
    expect(q.pageSize).toBe(25);
  });
  it("coerces string numbers from URL query params", () => {
    const q = paginationQuerySchema.parse({ page: "3", pageSize: "50" });
    expect(q).toEqual({ page: 3, pageSize: 50 });
  });
  it("rejects pageSize above the hard cap (prevents unbounded extraction)", () => {
    expect(() => paginationQuerySchema.parse({ pageSize: "101" })).toThrow(ZodError);
    expect(() => paginationQuerySchema.parse({ page: "0" })).toThrow(ZodError);
    expect(() => paginationQuerySchema.parse({ page: "-1" })).toThrow(ZodError);
  });
  it("trims and rejects empty search strings", () => {
    expect(paginationQuerySchema.parse({ search: " acme " }).search).toBe("acme");
    expect(() => paginationQuerySchema.parse({ search: "   " })).toThrow(ZodError);
  });
});

describe("auth input schemas", () => {
  it("enforces minimum password length on registration (12 chars)", () => {
    const base = {
      email: "a@b.co",
      name: "A B",
      organizationName: "Org",
      organizationSlug: "org-1",
    };
    expect(() => registerSchema.parse({ ...base, password: "short123" })).toThrow(ZodError);
    expect(registerSchema.parse({ ...base, password: "long-enough-pass" }).password).toBe("long-enough-pass");
  });
  it("rejects malformed slugs and emails", () => {
    expect(() =>
      registerSchema.parse({
        email: "not-an-email",
        password: "long-enough-pass",
        name: "x",
        organizationName: "O",
        organizationSlug: "UPPER_SLUG",
      }),
    ).toThrow(ZodError);
    expect(() => signInSchema.parse({ email: "a@b.co", password: "1234567" })).toThrow(ZodError);
  });
});

describe("invoice line schema", () => {
  it("requires at least one line and rejects non-positive quantities", () => {
    expect(() => createInvoiceSchema.parse({ lines: [] })).toThrow(ZodError);
    expect(() =>
      createInvoiceSchema.parse({ lines: [{ description: "x", quantity: 0, unitPrice: "10" }] }),
    ).toThrow(ZodError);
  });
  it("clamps tax rate to 0..100", () => {
    expect(() =>
      createInvoiceSchema.parse({
        lines: [{ description: "x", quantity: 1, unitPrice: "10", taxRate: 101 }],
      }),
    ).toThrow(ZodError);
  });
  it("defaults invoice type to SALES", () => {
    const parsed = createInvoiceSchema.parse({
      lines: [{ description: "Consulting", quantity: 2, unitPrice: "50.00", taxRate: 18 }],
    });
    expect(parsed.type).toBe("SALES");
  });
});

describe("stock movement schema", () => {
  it("rejects zero quantity and absurd magnitudes", () => {
    const base = { productId: "p", warehouseId: "w", type: "ADJUSTMENT" };
    expect(() => stockMovementSchema.parse({ ...base, quantity: 0 })).toThrow(ZodError);
    expect(() => stockMovementSchema.parse({ ...base, quantity: 2_000_000 })).toThrow(ZodError);
    expect(stockMovementSchema.parse({ ...base, quantity: -5 }).quantity).toBe(-5);
  });
});

describe("in-memory rate limiter", () => {
  beforeEach(() => __resetRateLimitsForTesting());

  it("allows requests up to the limit then blocks", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("k", 5, 60_000).ok).toBe(true);
    }
    const blocked = checkRateLimit("k", 5, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keys are independent per bucket", () => {
    expect(checkRateLimit("a", 1, 60_000).ok).toBe(true);
    expect(checkRateLimit("a", 1, 60_000).ok).toBe(false);
    expect(checkRateLimit("b", 1, 60_000).ok).toBe(true);
  });
});

describe("opaque token hashing", () => {
  it("produces distinct raw tokens with deterministic hashes", () => {
    const t1 = generateOpaqueToken();
    const t2 = generateOpaqueToken();
    expect(t1.token).not.toBe(t2.token);
    expect(hashToken(t1.token)).toBe(t1.tokenHash);
    expect(t1.tokenHash).not.toBe(t2.tokenHash);
    // Raw token must never equal its stored representation.
    expect(t1.tokenHash).not.toContain(t1.token);
  });
  it("safeEqualHex is timing-safe and length-safe", () => {
    const h = hashToken("abc");
    expect(safeEqualHex(h, h)).toBe(true);
    expect(safeEqualHex(h, hashToken("abd"))).toBe(false);
    expect(safeEqualHex(h, "deadbeef")).toBe(false); // different lengths, no throw
  });
});
