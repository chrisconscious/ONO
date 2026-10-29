import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatNumber, formatRelative } from "@/lib/format";

export function StatCard({
  label,
  value,
  hint,
  href,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  className?: string;
}) {
  const content = (
    <>
      <p className="text-[0.7rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </>
  );

  const classes = cn(
    "flex flex-col rounded-xl border border-border bg-card p-4 shadow-xs",
    href && "transition-colors hover:border-primary/30 hover:bg-accent/40",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}

/** Compact list of recent events with relative timestamps. */
export function ActivityList({
  items,
  emptyLabel,
}: {
  items: Array<{
    id: string;
    title: string;
    meta?: string;
    timestamp: Date;
  }>;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
          <span
            aria-hidden="true"
            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{item.title}</p>
            {item.meta ? (
              <p className="truncate text-xs text-muted-foreground">{item.meta}</p>
            ) : null}
          </div>
          <time
            dateTime={item.timestamp.toISOString()}
            className="shrink-0 text-xs whitespace-nowrap text-muted-foreground"
          >
            {formatRelative(item.timestamp)}
          </time>
        </li>
      ))}
    </ul>
  );
}
