import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  humanise,
  pluralise,
} from "@/lib/format";

describe("format helpers", () => {
  it("formats counts with tabular grouping", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(null)).toBe("—");
  });

  it("formats currency and falls back for an unsupported code", () => {
    expect(formatCurrency(250, "TZS")).toContain("250");
    expect(formatCurrency(250, "NOT_A_CURRENCY")).toBe("NOT_A_CURRENCY 250");
    expect(formatCurrency(undefined)).toBe("—");
  });

  it("formats dates without exposing invalid values", () => {
    expect(formatDate("2026-10-27T00:00:00.000Z")).toMatch(/2026/);
    expect(formatDate("not-a-date")).toBe("—");
    expect(formatDate(null)).toBe("—");
  });

  it("humanises enum-like identifiers", () => {
    expect(humanise("SALES_ORDER")).toBe("Sales Order");
    expect(humanise("partially-paid")).toBe("Partially Paid");
    expect(humanise("")).toBe("—");
  });

  it("pluralises singular and plural labels", () => {
    expect(pluralise(1, "invoice")).toBe("invoice");
    expect(pluralise(2, "invoice")).toBe("invoices");
    expect(pluralise(2, "company", "companies")).toBe("companies");
  });
});
