import { cn } from "@/lib/utils";

/**
 * ONO monogram: an open ring that reads as a continuous operating loop, with a
 * solid node marking the business data that runs through it.
 */
export function LogoMark({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
      {...props}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
        <path
          d="M18.4 8.1a7.2 7.2 0 1 0 0 7.8"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="19.15" cy="12" r="2.35" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  markClassName,
  showTagline = false,
  tone = "default",
}: {
  className?: string;
  markClassName?: string;
  showTagline?: boolean;
  tone?: "default" | "inverse";
}) {
  const inverse = tone === "inverse";

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark
        className={cn(
          inverse && "bg-white text-primary shadow-sm",
          markClassName,
        )}
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[0.95rem] font-semibold tracking-[0.16em]",
            inverse ? "text-white" : "text-foreground",
          )}
        >
          ONO
        </span>
        {showTagline ? (
          <span
            className={cn(
              "mt-1 text-[0.65rem] font-medium tracking-[0.08em] uppercase",
              inverse ? "text-white/60" : "text-muted-foreground",
            )}
          >
            Business intelligence
          </span>
        ) : null}
      </span>
    </span>
  );
}
