"use client";

import Link from "next/link";
import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Restrained page-level skeleton used by route loading boundaries. */
export function PageSkeleton({ label = "Loading page" }: { label?: string }) {
  return (
    <div className="flex flex-col gap-6" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-40 max-w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/5" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Safe route error surface. It never renders the raw exception, database error
 * or stack trace; only an opaque support reference supplied by Next.js.
 */
export function RouteError({
  title,
  description,
  reference,
  reset,
  homeHref,
  homeLabel,
}: {
  title: string;
  description: string;
  reference?: string;
  reset: () => void;
  homeHref: string;
  homeLabel: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-xs">
      <div
        role="alert"
        className="flex items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-3"
      >
        <AlertTriangleIcon
          className="mt-0.5 size-5 shrink-0 text-destructive"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          {reference ? (
            <p className="mt-2 font-mono text-xs break-all text-muted-foreground">
              Support reference: {reference}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => reset()}>
          <RotateCcwIcon aria-hidden="true" />
          Try again
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href={homeHref} />}>
          {homeLabel}
        </Button>
      </div>
    </div>
  );
}
