import { cn } from "@/lib/utils";
import { humanise } from "@/lib/format";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

const toneStyles: Record<Tone, string> = {
  neutral: "border-border bg-muted/70 text-muted-foreground",
  success:
    "border-success/25 bg-success/10 text-[color-mix(in_oklch,var(--success),var(--foreground)_30%)]",
  warning: "border-warning/30 bg-warning/10 text-[color-mix(in_oklch,var(--warning),var(--foreground)_28%)]",
  danger:
    "border-destructive/25 bg-destructive/10 text-[color-mix(in_oklch,var(--destructive),var(--foreground)_22%)]",
  info: "border-info/25 bg-info/10 text-[color-mix(in_oklch,var(--info),var(--foreground)_38%)]",
  primary: "border-primary/25 bg-primary/10 text-primary",
};

const dotStyles: Record<Tone, string> = {
  neutral: "bg-muted-foreground/60",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
  primary: "bg-primary",
};

const statusTones: Record<string, Tone> = {
  ACTIVE: "success",
  APPROVED: "success",
  PAID: "success",
  DONE: "success",
  COMPLETED: "success",
  CLOSED_WON: "success",
  PUBLISHED: "success",
  ACCEPTED: "success",

  PROVISIONING: "info",
  PENDING: "warning",
  CHANGES_REQUESTED: "warning",
  PENDING_REVIEW: "warning",
  DRAFT: "neutral",
  INVITED: "info",
  PARTIALLY_PAID: "warning",
  TODO: "neutral",
  IN_PROGRESS: "info",
  REVIEW: "warning",
  PLANNING: "info",
  OPEN: "info",
  NEW: "info",
  CONTACTED: "info",
  QUALIFIED: "success",
  QUALIFICATION: "info",
  PROPOSAL: "info",
  NEGOTIATION: "warning",
  PROSPECTING: "neutral",
  SENT: "info",

  SUSPENDED: "danger",
  REJECTED: "danger",
  OVERDUE: "danger",
  CLOSED_LOST: "danger",
  UNQUALIFIED: "neutral",
  LOST: "danger",
  CANCELLED: "neutral",
  VOID: "neutral",
  EXPIRED: "danger",
  REVOKED: "danger",
  REMOVED: "neutral",

  CLOSING: "warning",
  CLOSED: "neutral",
  WRITTEN_OFF: "neutral",
  DEPRECATED: "neutral",
  ARCHIVED: "neutral",
};

export function StatusBadge({
  status,
  label,
  tone,
  showDot = true,
  className,
}: {
  status: string;
  label?: string;
  tone?: Tone;
  showDot?: boolean;
  className?: string;
}) {
  const resolvedTone = tone ?? statusTones[status] ?? "neutral";

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-[0.7rem] font-medium whitespace-nowrap",
        toneStyles[resolvedTone],
        className,
      )}
    >
      {showDot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", dotStyles[resolvedTone])}
        />
      ) : null}
      {label ?? humanise(status)}
    </span>
  );
}
