import Link from "next/link";
import { CalendarClockIcon, ShieldAlertIcon } from "lucide-react";
import { EmptyState } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { formatCurrency, formatDate, humanise } from "@/lib/format";
import { hasDatePassed, type ScoreFactorView } from "@/lib/crm/presentation";
import { cn } from "@/lib/utils";

/** Permission denial state used by CRM workspace pages. */
export function CrmAccessDenied({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs">
      <EmptyState
        icon={<ShieldAlertIcon aria-hidden="true" />}
        title={title}
        description={description}
      />
    </div>
  );
}

/** Shows each currency separately because values are never cross-summed. */
export function CurrencyAmounts({
  rows,
  emptyLabel = "No value recorded",
  className,
}: {
  rows: Array<{ currency: string; value: number }>;
  emptyLabel?: string;
  className?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className={cn("flex flex-wrap items-baseline gap-x-4 gap-y-1", className)}>
      {rows.map((row) => (
        <li
          key={row.currency}
          className="text-sm font-medium text-foreground tabular"
        >
          {formatCurrency(row.value, row.currency)}
        </li>
      ))}
    </ul>
  );
}

export type CrmTaskSummary = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  assignee: { name: string | null; email: string } | null;
};

/** Compact task list shared by CRM record pages. */
export function CrmTaskList({
  tasks,
  emptyDescription = "Tasks linked to this record will appear here.",
}: {
  tasks: CrmTaskSummary[];
  emptyDescription?: string;
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClockIcon aria-hidden="true" />}
        title="No linked tasks"
        description={emptyDescription}
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {tasks.map((task) => {
        const open = task.status !== "DONE" && task.status !== "CANCELLED";
        const overdue = open && hasDatePassed(task.dueDate);

        return (
          <li
            key={task.id}
            className="flex flex-wrap items-start justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{task.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {task.assignee?.name ?? task.assignee?.email ?? "Unassigned"}
                {task.dueDate ? (
                  <span className={overdue ? "text-destructive" : undefined}>
                    {" "}
                    · due {formatDate(task.dueDate)}
                    {overdue ? " (overdue)" : ""}
                  </span>
                ) : (
                  " · no due date"
                )}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <StatusBadge
                status={task.priority}
                label={humanise(task.priority)}
                tone={
                  task.priority === "URGENT" || task.priority === "HIGH"
                    ? "warning"
                    : "neutral"
                }
              />
              <StatusBadge status={task.status} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Labelled facts in a responsive definition list. */
export function DetailRows({
  rows,
}: {
  rows: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0">
          <dt className="text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
            {row.label}
          </dt>
          <dd className="mt-1 text-sm leading-relaxed break-words text-foreground">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Shows every contribution to a baseline score or probability. */
export function ScoreFactorList({ factors }: { factors: ScoreFactorView[] }) {
  if (factors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No factors are stored for this calculation yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {factors.map((factor) => (
        <li key={factor.key} className="py-2.5 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-foreground">{factor.label}</p>
            <span
              className={cn(
                "shrink-0 text-sm font-semibold tabular",
                factor.points > 0
                  ? "text-[color-mix(in_oklch,var(--success),var(--foreground)_30%)]"
                  : factor.points < 0
                    ? "text-destructive"
                    : "text-muted-foreground",
              )}
            >
              {factor.points > 0 ? `+${factor.points}` : factor.points}
            </span>
          </div>
          {factor.detail ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {factor.detail}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Small inline navigation link used across CRM summaries. */
export function RecordLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}
