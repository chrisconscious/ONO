/**
 * Absolute links for authentication emails.
 *
 * The base URL is explicit configuration, never the incoming Host header, so a
 * forged request cannot make a recovery link point at another origin.
 */
export function appBaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const configured = env.NEXT_PUBLIC_APP_URL?.trim();
  const value = configured && configured.length > 0 ? configured : "http://localhost:3000";

  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return "http://localhost:3000";
  }
}

export function authLink(path: string, token: string) {
  const url = new URL(`${appBaseUrl()}${path}`);
  url.searchParams.set("token", token);
  return url.toString();
}
