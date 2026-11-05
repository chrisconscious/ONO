/**
 * Converts a User-Agent string into a short, human-readable device label.
 *
 * Only the family is reported. The raw header is never shown in the account
 * screen, which keeps the UI readable and avoids echoing arbitrary input.
 */
export function describeUserAgent(userAgent: string | null | undefined) {
  if (!userAgent) return "Unknown device";

  const ua = userAgent.toLowerCase();

  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("opr/") || ua.includes("opera")
      ? "Opera"
      : ua.includes("firefox/")
        ? "Firefox"
        : ua.includes("chrome/") || ua.includes("chromium/")
          ? "Chrome"
          : ua.includes("safari/")
            ? "Safari"
            : "Browser";

  const platform = ua.includes("windows")
    ? "Windows"
    : ua.includes("android")
      ? "Android"
      : ua.includes("iphone") || ua.includes("ipad")
        ? "iOS"
        : ua.includes("mac os x") || ua.includes("macintosh")
          ? "macOS"
          : ua.includes("linux")
            ? "Linux"
            : "Unknown platform";

  return `${browser} on ${platform}`;
}
