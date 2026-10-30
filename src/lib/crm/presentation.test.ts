import { describe, expect, it } from "vitest";
import {
  daysSinceDate,
  formatCurrencyTotals,
  hasDatePassed,
  methodLabel,
  readScoreFactors,
  transitionLabel,
} from "@/lib/crm/presentation";

describe("CRM presentation helpers", () => {
  it("reads well-formed score factors and drops malformed entries", () => {
    const factors = readScoreFactors([
      { key: "stage", label: "Pipeline stage", points: 45, detail: "Base" },
      { label: "Recent activity", points: "8", detail: "Contacted" },
      { key: "broken", label: "", points: 3 },
      { key: "noPoints", label: "No points" },
      "not-an-object",
      null,
    ]);

    expect(factors).toHaveLength(2);
    expect(factors[0]).toEqual({
      key: "stage",
      label: "Pipeline stage",
      points: 45,
      detail: "Base",
    });
    expect(factors[1]).toMatchObject({
      key: "Recent activity",
      points: 8,
    });
  });

  it("returns an empty factor list for non-array input", () => {
    expect(readScoreFactors(null)).toEqual([]);
    expect(readScoreFactors({ label: "x" })).toEqual([]);
    expect(readScoreFactors("[]")).toEqual([]);
  });

  it("never labels a baseline as a trained model", () => {
    expect(methodLabel("RULE_BASELINE_V1")).toBe("Rule-based baseline");
    expect(methodLabel("HISTORICAL_STAGE_BASELINE_V1")).toBe(
      "Historical stage baseline",
    );
    expect(methodLabel("CUSTOM_METHOD")).toBe("Custom Method");
    expect(methodLabel(null)).toBe("Not calculated");
  });

  it("keeps currencies separate in combined totals", () => {
    const combined = formatCurrencyTotals([
      { currency: "TZS", value: 1000 },
      { currency: "USD", value: 20 },
    ]);

    expect(combined).toContain("·");
    expect(combined).toContain("1,000");
    expect(combined).toContain("20");
    expect(formatCurrencyTotals([], "Nothing recorded")).toBe(
      "Nothing recorded",
    );
  });

  it("turns stored transition keys into readable text", () => {
    expect(transitionLabel("PROPOSAL→NEGOTIATION")).toBe(
      "Proposal → Negotiation",
    );
    expect(transitionLabel("CLOSED_WON")).toBe("Closed Won");
  });

  it("compares stored dates with the current time", () => {
    expect(hasDatePassed(new Date(Date.now() - 60_000))).toBe(true);
    expect(hasDatePassed(new Date(Date.now() + 60_000))).toBe(false);
    expect(hasDatePassed(null)).toBe(false);
    expect(hasDatePassed(undefined)).toBe(false);
  });

  it("counts whole days since a stored date", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000);
    expect(daysSinceDate(twoDaysAgo)).toBe(2);
    expect(daysSinceDate(new Date(Date.now() + 86_400_000))).toBe(0);
    expect(daysSinceDate(null)).toBe(0);
  });
});
