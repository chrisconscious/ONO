"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Applies the user's theme through a class on <html>. The stored preference is
 * restored from the server on each authenticated surface, while next-themes
 * keeps the choice in localStorage so the sign-in screens match too.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="ono-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
