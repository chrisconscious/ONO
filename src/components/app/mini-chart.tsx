import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/lib/format";
import type { DailyCount } from "@/server/services/platform/overview.service";

/**
 * Lightweight server-rendered bar chart. No charting dependency is needed for
 * a single-series daily count, and the numbers stay accessible as text.
 */
export function DailyBarChart({
  data,
  caption,
  className,
}: {
  data: DailyCount[];
  caption: string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((point) => point.count));
  const total = data.reduce((sum, point) => sum + point.count, 0);

  return (
    <figure className={cn("space-y-3", className)}>
      <div className="flex items-end gap-1" role="img" aria-label={caption}>
        {data.map((point) => {
          const height = Math.round((point.count / max) * 100);
          return (
            <div
              key={point.date}
              className="group/bar relative flex h-24 flex-1 items-end"
              title={`${formatDate(point.date)}: ${point.count}`}
            >
              <div
                className="w-full rounded-sm bg-primary/25 transition-colors group-hover/bar:bg-primary/60"
                style={{ height: `${Math.max(height, 3)}%` }}
              />
            </div>
          );
        })}
      </div>
      <figcaption className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{caption}</span>
        <span className="tabular">
          {formatNumber(total)} in {data.length} days
        </span>
      </figcaption>
    </figure>
  );
}

export function StatusBreakdown({
  items,
}: {
  items: Array<{ label: string; value: number }>;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <p className="py-6 text-sm text-muted-foreground">No records yet.</p>;
  }

  const palette = [
    "bg-chart-1",
    "bg-chart-2",
    "bg-chart-3",
    "bg-chart-4",
    "bg-chart-5",
  ];

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 rounded-full",
                  palette[index % palette.length],
                )}
              />
              <span className="text-foreground">{item.label}</span>
            </span>
            <span className="text-muted-foreground tabular">
              {formatNumber(item.value)}
              <span className="ml-1.5 text-xs">
                ({Math.round((item.value / total) * 100)}%)
              </span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", palette[index % palette.length])}
              style={{ width: `${(item.value / total) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
