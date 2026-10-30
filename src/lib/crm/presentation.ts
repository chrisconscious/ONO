import { formatCurrency, humanise } from "@/lib/format";

/**
 * Presentation helpers for CRM intelligence output.
 *
 * Stored JSON is narrowed here so pages never render unvalidated shapes or
 * present a baseline calculation as a trained model.
 */

export type ScoreFactorView = {
  key: string;
  label: string;
  points: number;
  detail: string;
};

/** Reads stored scoring factors from JSON, dropping malformed entries. */
export function readScoreFactors(value: unknown): ScoreFactorView[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    const label = typeof row.label === "string" ? row.label.trim() : "";
    const points =
      typeof row.points === "number" ? row.points : Number(row.points);
    if (!label || Number.isNaN(points)) return [];

    return [
      {
        key: typeof row.key === "string" && row.key ? row.key : label,
        label,
        points,
        detail: typeof row.detail === "string" ? row.detail : "",
      },
    ];
  });
}

/** Human-readable scoring method label. Never claims a trained model. */
export function methodLabel(method: string | null | undefined) {
  switch (method) {
    case "RULE_BASELINE_V1":
      return "Rule-based baseline";
    case "HISTORICAL_STAGE_BASELINE_V1":
      return "Historical stage baseline";
    default:
      return method ? humanise(method) : "Not calculated";
  }
}

/** Formats per-currency values without ever adding currencies together. */
export function formatCurrencyTotals(
  rows: Array<{ currency: string; value: number }>,
  emptyLabel = "No value recorded",
) {
  if (rows.length === 0) return emptyLabel;
  return rows
    .map((row) => formatCurrency(row.value, row.currency))
    .join(" · ");
}

/** Turns a stored stage transition key into readable text. */
export function transitionLabel(key: string) {
  const [from, to] = key.split("→");
  if (!to) return humanise(key);
  return `${humanise(from)} → ${humanise(to)}`;
}

/** True when a stored date is earlier than now, evaluated on the server. */
export function hasDatePassed(date: Date | null | undefined) {
  return date != null && date.getTime() < Date.now();
}

/** Whole days elapsed since a stored date, floored at zero. */
export function daysSinceDate(date: Date | null | undefined) {
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}
