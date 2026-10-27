/**
 * In-process operational metrics registry.
 *
 * Deliberately dependency-free: counters/histograms live in memory and are
 * exposed via /api/metrics in a Prometheus text format, so any scraper can
 * collect them without the app shipping to an external monitoring provider.
 *
 * TENANT-SAFETY RULE: tenant identifiers must never be used as metric
 * labels — they would create unbounded cardinality and leak tenant existence
 * through an unauthenticated endpoint. Only route/status/method style labels
 * are permitted here.
 */

type Labels = Record<string, string>;

function labelKey(name: string, labels?: Labels): string {
  if (!labels || Object.keys(labels).length === 0) return name;
  const parts = Object.entries(labels)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}="${v.replace(/"/g, "")}"`)
    .join(",");
  return `${name}{${parts}}`;
}

const counters = new Map<string, number>();
const histograms = new Map<string, number[]>();

export function incCounter(name: string, value = 1, labels?: Labels): void {
  const key = labelKey(name, labels);
  counters.set(key, (counters.get(key) ?? 0) + value);
}

export function observeHistogram(name: string, value: number, labels?: Labels): void {
  const key = labelKey(name, labels);
  const arr = histograms.get(key) ?? [];
  arr.push(value);
  // Bound memory: keep the most recent samples only.
  if (arr.length > 10_000) arr.splice(0, arr.length - 10_000);
  histograms.set(key, arr);
}

// Percentile helper for summary output (nearest-rank method).
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

/** Render all registered metrics in Prometheus exposition text format. */
export function renderMetrics(): string {
  const lines: string[] = [];
  for (const [key, value] of counters) {
    lines.push(`${key} ${value}`);
  }
  for (const [key, samples] of histograms) {
    const base = key.split("{")[0];
    const labelPart = key.slice(base.length);
    const sorted = [...samples].sort((a, b) => a - b);
    const sum = samples.reduce((acc, n) => acc + n, 0);
    lines.push(`${base}_count${labelPart} ${samples.length}`);
    lines.push(`${base}_sum${labelPart} ${Math.round(sum)}`);
    lines.push(`${base}{quantile="0.5"${labelPart.slice(1, -1)}} ${percentile(sorted, 50)}`);
    lines.push(`${base}{quantile="0.95"${labelPart.slice(1, -1)}} ${percentile(sorted, 95)}`);
    lines.push(`${base}{quantile="0.99"${labelPart.slice(1, -1)}} ${percentile(sorted, 99)}`);
  }
  return lines.join("\n") + "\n";
}

/** Reset everything — used by tests only. */
export function resetMetrics(): void {
  counters.clear();
  histograms.clear();
}
