import { describe, expect, it } from "vitest";
import {
  LEAD_SCORE_METHOD,
  OPPORTUNITY_HISTORICAL_METHOD,
  OPPORTUNITY_PROBABILITY_METHOD,
  buildForecast,
  buildLeadHistory,
  estimateOpportunityProbability,
  forecastAssumptions,
  monthKey,
  monthLabel,
  nextMonthKeys,
  scoreLead,
  type LeadHistory,
  type LeadScoreInput,
  type OpportunityHistory,
} from "@/lib/crm/scoring";

const NOW = new Date("2026-10-29T12:00:00.000Z");
const DAY = 86_400_000;

const emptyHistory: LeadHistory = {
  sampleSize: 0,
  converted: 0,
  priorRate: 0.2,
  sourceStats: [],
};

const emptyOpportunityHistory: OpportunityHistory = {
  closedCount: 0,
  wonCount: 0,
  averageCycleDays: null,
  stageConversion: {},
};

/** Builds a complete lead input so each test states only what it exercises. */
function leadInput(overrides: Partial<LeadScoreInput> = {}): LeadScoreInput {
  return {
    status: "NEW",
    email: null,
    phone: null,
    companyName: null,
    industry: null,
    source: null,
    ownerId: null,
    estimatedValue: null,
    createdAt: NOW,
    lastContactedAt: null,
    history: emptyHistory,
    now: NOW,
    ...overrides,
  };
}

describe("lead scoring baseline", () => {
  it("smooths the conversion prior instead of inventing certainty", () => {
    const history = buildLeadHistory([]);
    expect(history.sampleSize).toBe(0);
    expect(history.priorRate).toBeCloseTo(0.2, 5);
    expect(history.sourceStats).toHaveLength(0);
  });

  it("groups conversion outcomes by normalised source", () => {
    const history = buildLeadHistory([
      { status: "CONVERTED", source: "Website" },
      { status: "LOST", source: "website " },
      { status: "NEW", source: "Referral" },
    ]);

    expect(history.sampleSize).toBe(3);
    expect(history.converted).toBe(1);
    const website = history.sourceStats.find((row) => row.source === "website");
    expect(website?.total).toBe(2);
    expect(website?.converted).toBe(1);
  });

  it("records a converted lead as an outcome rather than a forecast", () => {
    const result = scoreLead(leadInput({ status: "CONVERTED" }));

    expect(result.score).toBe(100);
    expect(result.method).toBe(LEAD_SCORE_METHOD);
    expect(result.factors).toHaveLength(1);
    expect(result.explanation).toContain("already converted");
  });

  it("explains every contribution and stays within the published range", () => {
    const result = scoreLead(
      leadInput({
        status: "QUALIFIED",
        email: "buyer@example.com",
        phone: "+255700000000",
        companyName: "Example Ltd",
        source: "Website",
        ownerId: "user_1",
        industry: "Retail",
        estimatedValue: 5000,
        createdAt: new Date(NOW.getTime() - 10 * DAY),
        lastContactedAt: new Date(NOW.getTime() - 2 * DAY),
      }),
    );

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(95);
    expect(result.method).toBe(LEAD_SCORE_METHOD);
    const keys = result.factors.map((factor) => factor.key);
    expect(keys).toContain("status");
    expect(keys).toContain("recency");
    expect(keys).toContain("source");
    expect(result.confidence).toBe("low");
    expect(result.sampleSize).toBe(0);
    expect(result.explanation).toContain("not a trained ML model");
  });

  it("penalises a stale, unqualified lead", () => {
    const fresh = scoreLead(
      leadInput({
        status: "CONTACTED",
        lastContactedAt: NOW,
      }),
    );
    const stale = scoreLead(
      leadInput({
        status: "UNQUALIFIED",
        createdAt: new Date(NOW.getTime() - 120 * DAY),
        lastContactedAt: new Date(NOW.getTime() - 60 * DAY),
      }),
    );

    expect(stale.score).toBeLessThan(fresh.score);
  });
});

describe("opportunity probability baseline", () => {
  const baseInput = {
    stage: "NEGOTIATION",
    amount: 10000,
    createdAt: new Date(NOW.getTime() - 20 * DAY),
    stageChangedAt: new Date(NOW.getTime() - 3 * DAY),
    expectedCloseDate: new Date(NOW.getTime() + 10 * DAY),
    lastActivityAt: new Date(NOW.getTime() - 2 * DAY),
    openTasks: 1,
    overdueTasks: 0,
    history: emptyOpportunityHistory,
    now: NOW,
  };

  it("records closed outcomes instead of forecasting them", () => {
    const won = estimateOpportunityProbability({
      ...baseInput,
      stage: "CLOSED_WON",
    });
    const lost = estimateOpportunityProbability({
      ...baseInput,
      stage: "CLOSED_LOST",
    });

    expect(won.probability).toBe(100);
    expect(lost.probability).toBe(0);
    expect(won.method).toBe(OPPORTUNITY_PROBABILITY_METHOD);
  });

  it("uses the stage baseline when no outcome history exists", () => {
    const result = estimateOpportunityProbability(baseInput);

    expect(result.method).toBe(OPPORTUNITY_PROBABILITY_METHOD);
    expect(result.probability).toBeGreaterThan(2);
    expect(result.probability).toBeLessThan(98);
    expect(result.sampleSize).toBe(0);
    expect(result.explanation).toContain("insufficient for a fitted model");
  });

  it("uses historical stage conversion once enough outcomes exist", () => {
    const result = estimateOpportunityProbability({
      ...baseInput,
      history: {
        closedCount: 12,
        wonCount: 6,
        averageCycleDays: 30,
        stageConversion: { NEGOTIATION: { total: 6, won: 3 } },
      },
    });

    expect(result.method).toBe(OPPORTUNITY_HISTORICAL_METHOD);
    expect(result.sampleSize).toBe(12);
    expect(result.factors.some((factor) => factor.key === "history")).toBe(
      true,
    );
  });

  it("reduces the baseline for overdue follow-ups", () => {
    const onTrack = estimateOpportunityProbability(baseInput);
    const overdue = estimateOpportunityProbability({
      ...baseInput,
      openTasks: 2,
      overdueTasks: 2,
    });

    expect(overdue.probability).toBeLessThan(onTrack.probability);
    expect(
      overdue.factors.find((factor) => factor.key === "tasks")?.points,
    ).toBeLessThan(0);
  });
});

describe("pipeline-weighted forecast", () => {
  const months = ["2026-10", "2026-11"];

  it("keeps currencies separate and excludes closed-lost deals", () => {
    const forecasts = buildForecast(
      [
        {
          id: "opp_1",
          name: "TZS deal",
          amount: 1000,
          currency: "TZS",
          stage: "PROPOSAL",
          winProbability: 50,
          expectedCloseDate: new Date("2026-10-15T00:00:00.000Z"),
          closedAt: null,
        },
        {
          id: "opp_2",
          name: "USD deal",
          amount: 200,
          currency: "USD",
          stage: "NEGOTIATION",
          winProbability: 25,
          expectedCloseDate: new Date("2026-11-05T00:00:00.000Z"),
          closedAt: null,
        },
        {
          id: "opp_3",
          name: "Lost deal",
          amount: 999,
          currency: "TZS",
          stage: "CLOSED_LOST",
          winProbability: 0,
          expectedCloseDate: new Date("2026-10-20T00:00:00.000Z"),
          closedAt: null,
        },
      ],
      months,
    );

    expect(forecasts.map((forecast) => forecast.currency)).toEqual([
      "TZS",
      "USD",
    ]);

    const tzs = forecasts[0];
    expect(tzs.totals.openCount).toBe(1);
    expect(tzs.totals.weighted).toBe(500);
    expect(tzs.totals.bestCase).toBe(1000);
    expect(tzs.totals.conservative).toBe(350);
    expect(tzs.totals.committed).toBe(0);

    const usd = forecasts[1];
    expect(usd.totals.weighted).toBe(50);
    expect(usd.totals.bestCase).toBe(200);
    expect(usd.totals.conservative).toBe(20);
  });

  it("reports closed-won value as committed", () => {
    const forecasts = buildForecast(
      [
        {
          id: "opp_1",
          name: "Won deal",
          amount: 1500,
          currency: "TZS",
          stage: "CLOSED_WON",
          winProbability: 100,
          expectedCloseDate: new Date("2026-10-01T00:00:00.000Z"),
          closedAt: new Date("2026-10-02T00:00:00.000Z"),
        },
      ],
      months,
    );

    expect(forecasts[0].totals.committed).toBe(1500);
    expect(forecasts[0].totals.committedCount).toBe(1);
    expect(forecasts[0].totals.openCount).toBe(0);
  });

  it("ignores opportunities without a close date or outside the buckets", () => {
    const forecasts = buildForecast(
      [
        {
          id: "opp_1",
          name: "No date",
          amount: 100,
          currency: "TZS",
          stage: "PROSPECTING",
          winProbability: 10,
          expectedCloseDate: null,
          closedAt: null,
        },
        {
          id: "opp_2",
          name: "Far future",
          amount: 100,
          currency: "TZS",
          stage: "PROSPECTING",
          winProbability: 10,
          expectedCloseDate: new Date("2027-06-01T00:00:00.000Z"),
          closedAt: null,
        },
      ],
      months,
    );

    expect(forecasts[0].totals.openCount).toBe(0);
    expect(forecasts[0].totals.weighted).toBe(0);
  });

  it("labels assumptions honestly as a baseline, not a trained model", () => {
    const assumptions = forecastAssumptions();
    expect(assumptions.join(" ")).toContain("never summed together");
    expect(assumptions.join(" ")).toContain("not a trained forecasting model");
  });

  it("builds stable month keys and labels", () => {
    expect(nextMonthKeys(3, new Date("2026-10-29T00:00:00.000Z"))).toEqual([
      "2026-10",
      "2026-11",
      "2026-12",
    ]);
    expect(monthKey(new Date("2026-01-15T00:00:00.000Z"))).toBe("2026-01");
    expect(monthLabel("2026-01")).toContain("2026");
  });
});
