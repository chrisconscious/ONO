import { describe, expect, it } from "vitest";
import { isSafeInternalPath } from "@/lib/auth/redirect";

describe("isSafeInternalPath", () => {
  it("accepts app-relative routes", () => {
    expect(isSafeInternalPath("/app")).toBe(true);
    expect(isSafeInternalPath("/app/invoices?status=PAID")).toBe(true);
    expect(isSafeInternalPath("/login?next=%2Fapp")).toBe(true);
  });

  it("rejects absolute and protocol-relative redirects", () => {
    expect(isSafeInternalPath("https://evil.example")).toBe(false);
    expect(isSafeInternalPath("//evil.example/app")).toBe(false);
    expect(isSafeInternalPath("/\\evil.example")).toBe(true);
    expect(isSafeInternalPath("app")).toBe(false);
    expect(isSafeInternalPath("")).toBe(false);
    expect(isSafeInternalPath(undefined)).toBe(false);
  });
});
