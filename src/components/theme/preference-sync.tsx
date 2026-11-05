"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import type { Preferences } from "@/lib/auth/validation";

/**
 * Applies the theme stored on the account once per server-provided value.
 *
 * A ref guard is important: the preferences form changes the theme before the
 * server round-trip completes, and this component must not fight it by
 * re-applying the stale server value on every render.
 */
export function PreferenceSync({ theme }: { theme: Preferences["theme"] }) {
  const { setTheme } = useTheme();
  const applied = useRef<string | null>(null);

  useEffect(() => {
    if (applied.current === theme) return;
    applied.current = theme;
    setTheme(theme);
  }, [theme, setTheme]);

  return null;
}
