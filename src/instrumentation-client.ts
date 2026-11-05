import { suppressKnownReactWarnings } from "@/lib/dev/known-react-warnings";

// Runs after the document loads and before React hydrates, so the filter is in
// place before the framework can emit development-only warnings.
suppressKnownReactWarnings();

// Next.js patches console.error for terminal log forwarding and the dev overlay
// shortly after bootstrap (and again on navigation). Re-apply the filter after
// those patches so it stays outermost. It removes itself once it catches the
// known warning.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  window.setTimeout(suppressKnownReactWarnings, 0);
  window.requestAnimationFrame(suppressKnownReactWarnings);
}

export function onRouterTransitionStart() {
  suppressKnownReactWarnings();
}
