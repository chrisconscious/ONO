/**
 * Transparent CRM scoring baselines.
 *
 * No trained machine-learning model exists in this project yet. Everything in
 * this module is a deterministic statistical baseline computed from stored CRM
 * records. The UI must label these outputs as baselines, never as ML.
 */

export type LeadOutcomeRow = {
  status: string;
  source: string | null;
};

export type LeadSourceStat = {
  source: string;
  total: number;
  converted: number;
  rate: number;
};

export type LeadHistory = {
  sampleSize: number;
  converted: number;
  priorRate: number;
  sourceStats: LeadSourceStat[];
};

export type ScoreFactor = {
  key: string;
  label: string;
  points: number;
  detail: string;
};

export type LeadScoreInput = {
  status: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  industry: string | null;
  source: string | null;
  ownerId: string | null;
  estimatedValue: number | null;
  createdAt: Date;
  lastContactedAt: Date | null;
  history: LeadHistory;
  now?: Date;
};

export type LeadScoreResult = {
  score: number;
  method: "RULE_BASELINE_V1";
  confidence: "low" | "medium" | "high";
  sampleSize: number;
  factors: ScoreFactor[];
  explanation: string;
  calculatedAt: string;
};

export const LEAD_SCORE_METHOD = "RULE_BASELINE_V1";
export const OPPORTUNITY_PROBABILITY_METHOD = "RULE_BASELINE_V1";
export const OPPORTUNITY_HISTORICAL_METHOD = "HISTORICAL_STAGE_BASELINE_V1";

const DEFAULT_CONVERSION_PRIOR = 0.2;
const SMOOTHING_WEIGHT = 5;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const daysBetween = (later: Date, earlier: Date) =>
  Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / 86_400_000));

function normaliseSource(source: string | null) {
  return (source ?? "").trim().toLowerCase();
}

/** Builds a smoothed conversion baseline from real lead outcomes. */
export function buildLeadHistory(rows: LeadOutcomeRow[]): LeadHistory {
  const converted = rows.filter((row) => row.status === "CONVERTED").length;
  const priorRate =
    (converted + SMOOTHING_WEIGHT * DEFAULT_CONVERSION_PRIOR) /
    (rows.length + SMOOTHING_WEIGHT);

  const groups = new Map<string, { total: number; converted: number }>();
  for (const row of rows) {
    const key = normaliseSource(row.source);
    const current = groups.get(key) ?? { total: 0, converted: 0 };
    current.total += 1;
    if (row.status === "CONVERTED") current.converted += 1;
    groups.set(key, current);
  }

  const sourceStats = [...groups.entries()]
    .map(([source, value]) => ({
      source,
      total: value.total,
      converted: value.converted,
      rate:
        (value.converted + SMOOTHING_WEIGHT * priorRate) /
        (value.total + SMOOTHING_WEIGHT),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    sampleSize: rows.length,
    converted,
    priorRate,
    sourceStats,
  };
}

/**
 * Scores a lead from explicit evidence. Each factor is returned so the UI can
 * explain the result and the reader can see why the score changed.
 */
export function scoreLead(input: LeadScoreInput): LeadScoreResult {
  const now = input.now ?? new Date();
  const factors: ScoreFactor[] = [];
  const ageDays = daysBetween(now, input.createdAt);
  const lastTouch = input.lastContactedAt ?? input.createdAt;
  const inactiveDays = daysBetween(now, lastTouch);

  factors.push({
    key: "base",
    label: "Base score",
    points: 10,
    detail: "Starting point for every open lead.",
  });

  const completeness: Array<[keyof LeadScoreInput, string, number]> = [
    ["email", "Email address", 6],
    ["phone", "Phone number", 5],
    ["companyName", "Company name", 5],
    ["source", "Lead source", 3],
    ["ownerId", "Assigned owner", 4],
    ["industry", "Industry", 2],
  ];

  for (const [field, label, points] of completeness) {
    if (input[field]) {
      factors.push({
        key: `field:${String(field)}`,
        label,
        points,
        detail: `${label} is recorded.`,
      });
    }
  }

  if (input.estimatedValue != null && input.estimatedValue > 0) {
    factors.push({
      key: "estimatedValue",
      label: "Estimated value",
      points: 3,
      detail: "A potential deal value is recorded.",
    });
  }

  const statusPoints: Record<string, number> = {
    NEW: 0,
    CONTACTED: 6,
    QUALIFIED: 18,
    UNQUALIFIED: -20,
    LOST: -30,
  };

  if (input.status === "CONVERTED") {
    return {
      score: 100,
      method: LEAD_SCORE_METHOD,
      confidence: "high",
      sampleSize: input.history.sampleSize,
      factors: [
        {
          key: "converted",
          label: "Converted",
          points: 100,
          detail: "The lead has already converted, so its conversion score is 100.",
        },
      ],
      explanation:
        "This lead is already converted. The score records the outcome and is not a forecast.",
      calculatedAt: now.toISOString(),
    };
  }

  const status = statusPoints[input.status] ?? 0;
  if (status !== 0) {
    factors.push({
      key: "status",
      label: "Qualification status",
      points: status,
      detail:
        status > 0
          ? `Status ${input.status} shows active qualification.`
          : `Status ${input.status} reduces the conversion baseline.`,
    });
  }

  if (ageDays > 90 && input.status === "NEW") {
    factors.push({
      key: "age",
      label: "Lead age",
      points: -8,
      detail: `The lead has been open for ${ageDays} days without progressing.`,
    });
  }

  if (lastTouch) {
    if (inactiveDays <= 3) {
      factors.push({
        key: "recency",
        label: "Recent contact",
        points: 8,
        detail: `Last contact was ${inactiveDays} day(s) ago.`,
      });
    } else if (inactiveDays <= 7) {
      factors.push({
        key: "recency",
        label: "Recent contact",
        points: 5,
        detail: `Last contact was ${inactiveDays} days ago.`,
      });
    } else if (inactiveDays <= 14) {
      factors.push({
        key: "recency",
        label: "Follow-up gap",
        points: 2,
        detail: `Last contact was ${inactiveDays} days ago.`,
      });
    } else if (inactiveDays <= 30) {
      factors.push({
        key: "recency",
        label: "Follow-up gap",
        points: -3,
        detail: `No contact for ${inactiveDays} days.`,
      });
    } else {
      factors.push({
        key: "recency",
        label: "Stale lead",
        points: -10,
        detail: `No contact for ${inactiveDays} days.`,
      });
    }
  }

  const source = normaliseSource(input.source);
  const sourceStat = source
    ? input.history.sourceStats.find((item) => item.source === source)
    : undefined;

  if (sourceStat) {
    const points = Math.round(sourceStat.rate * 32);
    factors.push({
      key: "source",
      label: "Source conversion history",
      points,
      detail: `${sourceStat.converted} of ${sourceStat.total} leads from "${input.source}" converted. The smoothed rate is ${(sourceStat.rate * 100).toFixed(1)}%.`,
    });
  } else {
    factors.push({
      key: "source",
      label: "Source conversion history",
      points: Math.round(input.history.priorRate * 20),
      detail:
        input.source
          ? `No historical outcomes exist yet for "${input.source}". The workspace prior of ${(input.history.priorRate * 100).toFixed(1)}% is used.`
          : "No lead source is recorded, so the workspace prior is used.",
    });
  }

  const rawScore = factors.reduce((total, factor) => total + factor.points, 0);
  const score = clamp(Math.round(rawScore), 0, 95);
  const confidence =
    input.history.sampleSize >= 30
      ? "high"
      : input.history.sampleSize >= 10
        ? "medium"
        : "low";

  return {
    score,
    method: LEAD_SCORE_METHOD,
    confidence,
    sampleSize: input.history.sampleSize,
    factors: factors.sort((a, b) => Math.abs(b.points) - Math.abs(a.points)),
    explanation:
      `Statistical baseline from ${input.history.sampleSize} stored lead(s), ` +
      `${input.history.converted} converted. This is a rule-based score, not a trained ML model.`,
    calculatedAt: now.toISOString(),
  };
}

export type OpportunityHistory = {
  closedCount: number;
  wonCount: number;
  averageCycleDays: number | null;
  stageConversion: Partial<Record<string, { total: number; won: number }>>;
};

export type OpportunityProbabilityInput = {
  stage: string;
  amount: number | null;
  createdAt: Date;
  stageChangedAt: Date;
  expectedCloseDate: Date | null;
  lastActivityAt: Date | null;
  openTasks: number;
  overdueTasks: number;
  history: OpportunityHistory;
  now?: Date;
};

export type OpportunityProbabilityResult = {
  probability: number;
  method: typeof OPPORTUNITY_PROBABILITY_METHOD | typeof OPPORTUNITY_HISTORICAL_METHOD;
  confidence: "low" | "medium" | "high";
  sampleSize: number;
  factors: ScoreFactor[];
  explanation: string;
  calculatedAt: string;
};

const stageBase: Record<string, number> = {
  PROSPECTING: 10,
  QUALIFICATION: 25,
  PROPOSAL: 45,
  NEGOTIATION: 65,
  CLOSED_WON: 100,
  CLOSED_LOST: 0,
};

/**
 * Estimates win probability from stage, activity and historical outcomes.
 * Closed opportunities return their actual outcome rather than a forecast.
 */
export function estimateOpportunityProbability(
  input: OpportunityProbabilityInput,
): OpportunityProbabilityResult {
  const now = input.now ?? new Date();

  if (input.stage === "CLOSED_WON" || input.stage === "CLOSED_LOST") {
    const won = input.stage === "CLOSED_WON";
    return {
      probability: won ? 100 : 0,
      method: OPPORTUNITY_PROBABILITY_METHOD,
      confidence: "high",
      sampleSize: input.history.closedCount,
      factors: [
        {
          key: "closed",
          label: won ? "Won" : "Lost",
          points: won ? 100 : 0,
          detail: "The opportunity is closed; the value records the outcome.",
        },
      ],
      explanation:
        "This opportunity is closed. The probability records the outcome, not a forecast.",
      calculatedAt: now.toISOString(),
    };
  }

  const factors: ScoreFactor[] = [];
  const stagePoints = stageBase[input.stage] ?? 10;
  factors.push({
    key: "stage",
    label: "Pipeline stage",
    points: stagePoints,
    detail: `Stage ${input.stage.replaceAll("_", " ").toLowerCase()} carries the base estimate.`,
  });

  const historyStage = input.history.stageConversion[input.stage];
  let method: OpportunityProbabilityResult["method"] =
    OPPORTUNITY_PROBABILITY_METHOD;
  let base = stagePoints;

  if (historyStage && historyStage.total >= 5) {
    const observed = ((historyStage.won + 2 * (stagePoints / 100)) / (historyStage.total + 2)) * 100;
    base = Math.round(observed * 0.6 + stagePoints * 0.4);
    factors.push({
      key: "history",
      label: "Historical stage conversion",
      points: base - stagePoints,
      detail: `${historyStage.won} of ${historyStage.total} opportunities that entered ${input.stage.replaceAll("_", " ").toLowerCase()} were won.`,
    });
    method = OPPORTUNITY_HISTORICAL_METHOD;
  } else if (input.history.closedCount >= 5) {
    const observed = (input.history.wonCount / input.history.closedCount) * 100;
    base = Math.round(stagePoints * 0.7 + observed * 0.3);
    factors.push({
      key: "history",
      label: "Workspace win rate",
      points: base - stagePoints,
      detail: `${input.history.wonCount} of ${input.history.closedCount} closed opportunities were won. Stage history is still too small for a per-stage rate.`,
    });
    method = OPPORTUNITY_HISTORICAL_METHOD;
  }

  const ageDays = daysBetween(now, input.createdAt);
  const stalledDays = daysBetween(now, input.stageChangedAt);
  const lastTouch = input.lastActivityAt ?? input.stageChangedAt;
  const inactiveDays = daysBetween(now, lastTouch);

  if (inactiveDays <= 7) {
    factors.push({
      key: "activity",
      label: "Recent activity",
      points: 8,
      detail: `The last activity was ${inactiveDays} day(s) ago.`,
    });
  } else if (inactiveDays <= 14) {
    factors.push({
      key: "activity",
      label: "Activity gap",
      points: 3,
      detail: `The last activity was ${inactiveDays} days ago.`,
    });
  } else if (inactiveDays > 30) {
    factors.push({
      key: "activity",
      label: "No recent activity",
      points: -10,
      detail: `No activity for ${inactiveDays} days.`,
    });
  }

  if (stalledDays > 21) {
    factors.push({
      key: "stall",
      label: "Stage aging",
      points: -6,
      detail: `The opportunity has stayed in this stage for ${stalledDays} days.`,
    });
  }

  if (ageDays > 90) {
    factors.push({
      key: "age",
      label: "Deal age",
      points: -5,
      detail: `The opportunity has been open for ${ageDays} days.`,
    });
  }

  if (input.expectedCloseDate) {
    const daysToClose = Math.ceil(
      (input.expectedCloseDate.getTime() - now.getTime()) / 86_400_000,
    );
    if (daysToClose < 0) {
      factors.push({
        key: "closeDate",
        label: "Expected close date",
        points: -10,
        detail: `The expected close date passed ${Math.abs(daysToClose)} day(s) ago.`,
      });
    } else if (daysToClose <= 14) {
      factors.push({
        key: "closeDate",
        label: "Closing soon",
        points: 3,
        detail: `The expected close date is in ${daysToClose} day(s).`,
      });
    }
  } else {
    factors.push({
      key: "closeDate",
      label: "Expected close date",
      points: -3,
      detail: "No expected close date is recorded.",
    });
  }

  if (input.overdueTasks > 0) {
    factors.push({
      key: "tasks",
      label: "Overdue follow-ups",
      points: -Math.min(9, input.overdueTasks * 3),
      detail: `${input.overdueTasks} linked task(s) are overdue.`,
    });
  } else if (input.openTasks > 0) {
    factors.push({
      key: "tasks",
      label: "Active follow-up",
      points: 2,
      detail: `${input.openTasks} linked task(s) are open and not overdue.`,
    });
  }

  if (input.amount == null || input.amount <= 0) {
    factors.push({
      key: "amount",
      label: "Deal value",
      points: -3,
      detail: "No opportunity value is recorded, so forecasting is incomplete.",
    });
  }

  const probability = clamp(
    Math.round(base + factors.reduce((sum, factor) => sum + (factor.key === "stage" ? 0 : factor.points), 0)),
    2,
    98,
  );
  const sampleSize = input.history.closedCount;
  const confidence =
    sampleSize >= 30 ? "high" : sampleSize >= 10 ? "medium" : "low";

  return {
    probability,
    method,
    confidence,
    sampleSize,
    factors: factors.sort((a, b) => Math.abs(b.points) - Math.abs(a.points)),
    explanation:
      method === OPPORTUNITY_HISTORICAL_METHOD
        ? `Statistical baseline blended with ${sampleSize} closed workspace opportunit${sampleSize === 1 ? "y" : "ies"}. This is not a trained ML model.`
        : `Rule-based stage baseline. Only ${sampleSize} closed workspace opportunit${sampleSize === 1 ? "y" : "ies"} exist, which is insufficient for a fitted model.`,
    calculatedAt: now.toISOString(),
  };
}

export type ForecastOpportunity = {
  id: string;
  name: string;
  amount: number | null;
  currency: string;
  stage: string;
  winProbability: number | null;
  expectedCloseDate: Date | null;
  closedAt: Date | null;
};

export type ForecastBucket = {
  key: string;
  label: string;
  openCount: number;
  weighted: number;
  bestCase: number;
  conservative: number;
  committed: number;
  committedCount: number;
};

export type CurrencyForecast = {
  currency: string;
  buckets: ForecastBucket[];
  totals: {
    openCount: number;
    weighted: number;
    bestCase: number;
    conservative: number;
    committed: number;
    committedCount: number;
  };
};

/**
 * Produces a pipeline-weighted forecast per currency. Currencies are never
 * added together, and open and committed values are reported separately.
 */
export function buildForecast(
  opportunities: ForecastOpportunity[],
  months: string[] = nextMonthKeys(4),
): CurrencyForecast[] {
  const currencies = new Map<string, CurrencyForecast>();

  for (const opportunity of opportunities) {
    const currency = opportunity.currency || "TZS";
    const forecast = currencies.get(currency) ?? {
      currency,
      buckets: months.map((key) => ({
        key,
        label: monthLabel(key),
        openCount: 0,
        weighted: 0,
        bestCase: 0,
        conservative: 0,
        committed: 0,
        committedCount: 0,
      })),
      totals: {
        openCount: 0,
        weighted: 0,
        bestCase: 0,
        conservative: 0,
        committed: 0,
        committedCount: 0,
      },
    };

    const date = opportunity.expectedCloseDate ?? opportunity.closedAt;
    if (!date) {
      currencies.set(currency, forecast);
      continue;
    }

    const key = monthKey(date);
    const bucket = forecast.buckets.find((item) => item.key === key);
    if (!bucket) {
      currencies.set(currency, forecast);
      continue;
    }

    const amount = opportunity.amount ?? 0;

    if (opportunity.stage === "CLOSED_WON") {
      bucket.committed += amount;
      bucket.committedCount += 1;
      forecast.totals.committed += amount;
      forecast.totals.committedCount += 1;
    } else if (opportunity.stage !== "CLOSED_LOST") {
      const probability = clamp(opportunity.winProbability ?? 10, 0, 100);
      const conservativeProbability = clamp(probability - 15, 0, 100);

      bucket.openCount += 1;
      bucket.weighted += (amount * probability) / 100;
      bucket.bestCase += amount;
      bucket.conservative += (amount * conservativeProbability) / 100;
      forecast.totals.openCount += 1;
      forecast.totals.weighted += (amount * probability) / 100;
      forecast.totals.bestCase += amount;
      forecast.totals.conservative += (amount * conservativeProbability) / 100;
    }

    currencies.set(currency, forecast);
  }

  return [...currencies.values()].sort((a, b) =>
    a.currency.localeCompare(b.currency),
  );
}

export function nextMonthKeys(count = 4, from = new Date()): string[] {
  return Array.from({ length: count }).map((_, index) => {
    const date = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + index, 1));
    return monthKey(date);
  });
}

export function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Explains the assumptions behind a pipeline-weighted forecast. */
export function forecastAssumptions() {
  return [
    "Weighted value = open opportunity amount × its current win baseline.",
    "Best case = full open pipeline amount, with no probability weighting.",
    "Conservative case uses the win baseline reduced by 15 percentage points, floored at zero.",
    "Committed value is closed-won only; closed-lost is excluded.",
    "Currencies are reported separately and never summed together.",
    "This is a pipeline-weighted baseline, not a trained forecasting model.",
  ];
}
