import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookies";

/**
 * Fast cookie-presence gate.
 *
 * This is deliberately not the authorization boundary: a cookie can be forged,
 * expired or revoked. It only avoids rendering protected layouts for visitors
 * who have no session cookie at all. Every layout and route handler validates
 * the opaque token against the database before trusting it.
 */
export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = "";
  url.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/account/:path*"],
};
