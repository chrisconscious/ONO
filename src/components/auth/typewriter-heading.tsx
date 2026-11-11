"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** Milliseconds between typed characters. */
const CHARACTER_DELAY_MS = 42;
/** Extra pause after sentence punctuation so the rhythm feels natural. */
const PUNCTUATION_PAUSE_MS = 220;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

let reducedMotionQuery: MediaQueryList | null = null;

function getReducedMotionQuery() {
  reducedMotionQuery ??= window.matchMedia(REDUCED_MOTION_QUERY);
  return reducedMotionQuery;
}

function subscribeToReducedMotion(onChange: () => void) {
  const media = getReducedMotionQuery();
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return getReducedMotionQuery().matches;
}

/** The server cannot know the visitor's motion preference. */
function getReducedMotionServerSnapshot() {
  return false;
}

/**
 * Reveals a heading one character at a time.
 *
 * The complete text is always present in an invisible layer so the heading
 * reserves its final dimensions before typing starts, which keeps the
 * surrounding layout from shifting. The visible layer is absolutely positioned
 * over it and never changes the page flow.
 */
export function TypewriterHeading({ text }: { text: string }) {
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (reducedMotion || visibleCount >= text.length) return;

    const previous = text.charAt(visibleCount - 1);
    const delay = /[.!?]/.test(previous)
      ? CHARACTER_DELAY_MS + PUNCTUATION_PAUSE_MS
      : CHARACTER_DELAY_MS;

    const timer = window.setTimeout(() => {
      setVisibleCount((count) => Math.min(count + 1, text.length));
    }, delay);

    return () => window.clearTimeout(timer);
  }, [reducedMotion, text, visibleCount]);

  const shownCount = reducedMotion ? text.length : visibleCount;

  return (
    <>
      <span className="invisible" aria-hidden="true">
        {text}
      </span>
      <span aria-hidden="true" className="absolute inset-0">
        {text.slice(0, shownCount)}
        {reducedMotion ? null : (
          <span className="typewriter-caret ml-0.5 inline-block h-[1.05em] w-0.5 translate-y-[0.12em] rounded-full bg-white align-baseline" />
        )}
      </span>
      <span className="sr-only">{text}</span>
    </>
  );
}
