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
 * Reference sample used only when no customer stories have been published yet.
 * It is marked as a sample for assistive technology; published testimonials
 * always replace it.
 */
const sampleTestimonials: PublicTestimonial[] = [
  {
    quote:
      "Love the simplicity of the service and the prompt customer support. We can't imagine working without it.",
    authorName: "Felicity Pierre",
    authorTitle: "Head of Design, Layers",
    company: "UX Agency",
    rating: 5,
  },
];

/**
 * Wide glass testimonial panel shown over the authentication image.
 *
 * The quotation dominates the top of the card. The customer identity sits at
 * the lower left, the rating sits to the right of the name, and the circular
 * navigation controls sit in the lower-right corner. All slides share one grid
 * cell so switching testimonials never changes the card height.
 */
export function TestimonialCarousel({
  testimonials,
  className,
}: TestimonialCarouselProps) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const usingSample = testimonials.length === 0;
  const slides = usingSample ? sampleTestimonials : testimonials;
  const total = slides.length;
  const activeIndex = Math.min(index, total - 1);

  const goTo = useCallback(
    (direction: 1 | -1) => {
      if (total < 2) return;
      setIndex(
        (previous) =>
          (Math.min(previous, total - 1) + direction + total) % total,
      );
    },
    [total],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (total < 2) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setIndex(total - 1);
    }
  };

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
      tabIndex={0}
      data-placeholder={usingSample ? "true" : undefined}
      className={cn(
        "relative rounded-[16px] border border-white/40 bg-[#beb0a0]/50 p-5 text-white shadow-[0_18px_50px_-24px_rgba(2,6,23,0.7)] backdrop-blur-[18px] [-webkit-backdrop-filter:blur(18px)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 sm:p-6 sm:pb-10 xl:p-7 xl:pb-10",
        className,
      )}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/*
        Every slide shares the same grid cell. The panel is always as tall as
        the tallest quote, so the customer details and controls stay anchored.
      */}
      <div className="grid">
        {slides.map((testimonial, slideIndex) => {
          const active = slideIndex === activeIndex;

          return (
            <div
              key={`${testimonial.authorName}-${slideIndex}`}
              aria-hidden={active ? undefined : true}
              inert={!active}
              className={cn(
                "col-start-1 row-start-1 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
                active
                  ? "translate-x-0 opacity-100"
                  : "pointer-events-none translate-x-3 opacity-0",
              )}
            >
              <blockquote className="text-[1.3rem] leading-[1.42] font-bold tracking-[-0.01em] text-pretty text-white sm:text-[1.55rem] xl:text-[1.8rem]">
                <span aria-hidden="true">“</span>
                {testimonial.quote}
                <span aria-hidden="true">”</span>
              </blockquote>

              <div className="mt-7 flex flex-col gap-5 sm:mt-8 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <figcaption className="min-w-0">
                  <p className="text-xl leading-tight font-bold text-white sm:text-2xl">
                    {testimonial.authorName}
                  </p>
                  {testimonial.authorTitle ? (
                    <p className="mt-1 text-[0.95rem] leading-snug font-medium text-white/90 sm:text-base">
                      {testimonial.authorTitle}
                    </p>
                  ) : null}
                  {testimonial.company ? (
                    <p className="text-[0.8rem] leading-snug text-white/70 sm:text-sm">
                      {testimonial.company}
                    </p>
                  ) : null}
                </figcaption>

                <Stars
                  rating={testimonial.rating}
                  className="self-end sm:self-auto"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/*
        Controls live outside the slide grid. Keeping one stable pair means the
        keyboard focus ring never disappears when a slide becomes inert.
      */}
      <div className="mt-5 flex items-center justify-end gap-3 sm:absolute sm:right-6 sm:bottom-6 xl:right-7 xl:bottom-7">
        <CarouselButton
          label="Previous testimonial"
          inactive={total < 2}
          onClick={() => goTo(-1)}
        >
          <ChevronLeftIcon
            className="size-5 sm:size-6"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </CarouselButton>
        <CarouselButton
          label="Next testimonial"
          inactive={total < 2}
          onClick={() => goTo(1)}
        >
          <ChevronRightIcon
            className="size-5 sm:size-6"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </CarouselButton>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {usingSample
          ? "Sample testimonial shown until customer stories are published."
          : `Testimonial ${activeIndex + 1} of ${total}. Use the left and right arrow keys to browse.`}
      </p>
    </figure>
  );
}

function CarouselButton({
  label,
  inactive,
  onClick,
  children,
}: {
  label: string;
  inactive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-disabled={inactive || undefined}
      className="inline-flex size-11 items-center justify-center rounded-full border border-white/70 bg-transparent text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:bg-white/15 motion-reduce:transition-none sm:size-14"
    >
      {children}
    </button>
  );
}

function Stars({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="img"
      aria-label={`Rated ${clamped} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, position) => (
        <StarIcon
          key={position}
          aria-hidden="true"
          className={cn(
            "size-[1.05rem] sm:size-5",
            position < clamped ? "fill-white text-white" : "text-white/40",
          )}
        />
      ))}
    </div>
  );
}
