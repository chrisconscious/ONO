"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicTestimonial } from "@/server/services/testimonials/testimonials.service";

type TestimonialCarouselProps = {
  testimonials: PublicTestimonial[];
  className?: string;
};

/**
 * Testimonial card shown over the sign-in image panel.
 *
 * Only approved testimonials reach this component. When none are published the
 * card falls back to a product statement so the panel stays balanced without
 * inventing customers, quotes or ratings.
 */
export function TestimonialCarousel({
  testimonials,
  className,
}: TestimonialCarouselProps) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const total = testimonials.length;
  const current = total > 0 ? testimonials[index] : null;

  const goTo = useCallback(
    (direction: 1 | -1) => {
      if (total < 2) return;
      setIndex((previous) => (previous + direction + total) % total);
    },
    [total],
  );

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start == null || end == null) return;

    const delta = end - start;
    if (Math.abs(delta) < 48) return;
    goTo(delta < 0 ? 1 : -1);
  };

  return (
    <figure
      aria-roledescription="carousel"
      aria-label="Customer testimonials"
      className={cn(
        "rounded-2xl border border-white/20 bg-white/10 p-6 shadow-[0_20px_60px_-24px_rgba(2,6,23,0.75)] backdrop-blur-md sm:p-7",
        className,
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {current ? (
        <div aria-live="polite" aria-atomic="true">
          <Stars rating={current.rating} />

          <blockquote className="mt-4 min-h-[7.5rem] text-lg leading-snug font-semibold text-balance text-white sm:min-h-[6.5rem] sm:text-xl">
            <span aria-hidden="true">“</span>
            {current.quote}
            <span aria-hidden="true">”</span>
          </blockquote>

          <figcaption className="mt-5">
            <p className="text-sm font-semibold text-white">
              {current.authorName}
            </p>
            <p className="mt-0.5 text-sm text-white/70">
              {[current.authorTitle, current.company].filter(Boolean).join(" · ")}
            </p>
          </figcaption>
        </div>
      ) : (
        <div>
          <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-white/60 uppercase">
            One operating system
          </p>
          <p className="mt-3 min-h-[7.5rem] text-lg leading-snug font-semibold text-balance text-white sm:min-h-[6.5rem] sm:text-xl">
            Customer relationship, commercial, finance, procurement and delivery
            data in a single tenant-aware workspace.
          </p>
          <p className="mt-5 text-sm text-white/70">
            ONO — business intelligence and management platform
          </p>
        </div>
      )}

      {total > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/15 pt-4">
          <p className="text-xs font-medium tracking-wide text-white/60 tabular">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(-1)}
              aria-label="Previous testimonial"
              className="inline-flex size-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
            >
              <ChevronLeftIcon className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(1)}
              aria-label="Next testimonial"
              className="inline-flex size-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
            >
              <ChevronRightIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </figure>
  );
}

function Stars({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  if (clamped === 0) return null;

  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Rated ${clamped} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, position) => (
        <StarIcon
          key={position}
          aria-hidden="true"
          className={cn(
            "size-3.5",
            position < clamped ? "fill-white text-white" : "text-white/35",
          )}
        />
      ))}
    </div>
  );
}
