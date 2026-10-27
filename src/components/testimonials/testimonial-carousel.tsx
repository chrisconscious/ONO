"use client";

import { useEffect, useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";

interface PublicTestimonial {
  id: string;
  authorName: string;
  authorTitle: string;
  companyName: string;
  quote: string;
  rating: number | null;
}

/**
 * Login-page testimonial carousel.
 *
 * Data comes exclusively from GET /api/v1/public/testimonials, which returns
 * only explicitly approved rows with a field whitelist (no moderation
 * metadata). When the database has no published testimonials we render a
 * balanced brand panel — never fabricated quotes or fake customers.
 *
 * Accessibility: controls have accessible names, the live region announces
 * changes, keyboard focus works, and there is NO auto-rotation (so no pause
 * control is needed and reduced-motion users are unaffected).
 */
export function TestimonialCarousel() {
  const [items, setItems] = useState<PublicTestimonial[] | null>(null);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<PublicTestimonial[]>("/api/v1/public/testimonials", undefined, { tenantScoped: false })
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        // Fail closed visually: show the fallback, never placeholder quotes.
        if (!cancelled) {
          setFailed(true);
          setItems([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = items?.length ?? 0;
  const current = total > 0 ? items![index % total] : null;

  function go(delta: number) {
    if (total === 0) return;
    setIndex((i) => (i + delta + total) % total);
  }

  if (!items && !failed) {
    // Skeleton while loading — restrained, no layout shift when content lands.
    return (
      <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/20 bg-black/40 p-6 backdrop-blur-md">
        <div className="h-4 w-3/4 animate-pulse rounded bg-white/20" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/20" />
      </div>
    );
  }

  if (!current) {
    // Fallback: brand message only. No invented names, ratings, or quotes.
    return (
      <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/20 bg-black/40 p-6 backdrop-blur-md">
        <p className="text-lg font-semibold text-white">
          Trusted business intelligence, built for every industry.
        </p>
        <p className="mt-1 text-sm text-white/70">Customer stories will appear here.</p>
      </div>
    );
  }

  return (
    <figure
      className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/20 bg-black/45 p-6 backdrop-blur-md"
      aria-roledescription="carousel"
      aria-label="Customer testimonials"
    >
      <div aria-live="polite">
        {current.rating !== null && (
          <div
            className="flex gap-0.5"
            role="img"
            aria-label={`Rated ${current.rating} out of 5 stars`}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-4 ${i < current.rating! ? "fill-amber-400 text-amber-400" : "text-white/40"}`}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
        <blockquote className="mt-3 text-base font-bold leading-snug text-white md:text-lg">
          “{current.quote}”
        </blockquote>
        <figcaption className="mt-3 text-sm text-white/80">
          <span className="font-semibold text-white">{current.authorName}</span>
          {" — "}
          {current.authorTitle}, {current.companyName}
        </figcaption>
      </div>

      {total > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <span className="mr-auto text-xs text-white/60">
            {(index % total) + 1} of {total}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full border border-white/30 text-white hover:bg-white/10 hover:text-white"
            onClick={() => go(-1)}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full border border-white/30 text-white hover:bg-white/10 hover:text-white"
            onClick={() => go(1)}
            aria-label="Next testimonial"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </figure>
  );
}
