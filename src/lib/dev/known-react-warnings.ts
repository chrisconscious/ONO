/**
 * React 19.3 added a development-only warning that fires when a component
 * suspends through `use()` and then finishes a later render without calling
 * `use()` again ("conditional use of `use()`").
 *
 * Next.js 16.4.x triggers this from its own dev-only Suspense DevTools
 * instrumentation (`next/dist/client/components/layout-router.js` wraps the
 * resolved RSC node in `use()`, and `navigation.js` calls `use()` conditionally
 * on the instrumented navigation promises). The application itself never calls
 * `use()`. The condition lives in framework code, so it cannot be fixed from
 * application code and is not actionable here.
 *
 * Until Next.js ships a fix, suppress exactly this one message in development.
 * Every other warning and error still reaches the console untouched. React
 * emits the warning at most once per page load, so the filter removes itself
 * after the first match; that keeps this wrapper out of unrelated stack
 * traces. The filter is reinstalled on navigation start because Next.js wraps
 * `console.error` after bootstrap to forward browser logs to the terminal and
 * the dev overlay.
 *
 * Tracking:
 * - https://react.dev/warnings/conditional-use-of-use
 * - https://github.com/facebook/react/pull/34030
 */

export const REACT_CONDITIONAL_USE_WARNING =
  "This library called use() to suspend in a previous render but did not call use() when it finished";

type FilteredConsoleError = ((...args: unknown[]) => void) & {
  __onoKnownReactWarningFilter?: true;
};

function toMessage(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Error) {
    return value.message;
  }

  if (typeof value === "object" && value !== null && "message" in value) {
    const message = (value as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }

  return "";
}

/** Returns true when a `console.error(...)` call carries the known warning. */
export function isKnownReactWarning(args: readonly unknown[]): boolean {
  return args.some((arg) => toMessage(arg).includes(REACT_CONDITIONAL_USE_WARNING));
}

let installedWrapper: FilteredConsoleError | null = null;
let wrappedConsoleError: typeof console.error | null = null;
let warningAlreadyCaught = false;

function restoreConsoleError(): void {
  if (installedWrapper !== null && console.error === installedWrapper && wrappedConsoleError !== null) {
    console.error = wrappedConsoleError;
  }

  installedWrapper = null;
  wrappedConsoleError = null;
}

/**
 * Wraps the current `console.error` unless the active wrapper is already ours.
 * Safe to call repeatedly; it only adds a layer when another tool (such as the
 * Next.js dev overlay) has wrapped `console.error` since the previous call.
 */
export function suppressKnownReactWarnings(): void {
  if (
    typeof window === "undefined" ||
    process.env.NODE_ENV === "production" ||
    warningAlreadyCaught
  ) {
    return;
  }

  const current = console.error as FilteredConsoleError;
  if (current.__onoKnownReactWarningFilter) {
    return;
  }

  const filtered: FilteredConsoleError = (...args: unknown[]) => {
    if (isKnownReactWarning(args)) {
      warningAlreadyCaught = true;
      restoreConsoleError();
      return;
    }

    current.apply(console, args);
  };
  filtered.__onoKnownReactWarningFilter = true;

  installedWrapper = filtered;
  wrappedConsoleError = current;
  console.error = filtered;
}
