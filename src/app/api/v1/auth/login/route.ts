import { NextRequest, NextResponse } from "next/server";
import { ApiError, jsonError } from "@/lib/api/errors";
import { verifyCredentials } from "@/server/services/auth-service";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";
import { readJsonBody } from "@/lib/api/tenant-route";

export const dynamic = "force-dynamic";

/**
 * Session login endpoint. Credentials are verified server-side; the opaque
 * session token is delivered exclusively via an HttpOnly cookie so it can
 * never be read by page scripts. The response lists only the caller's own
 * memberships — roles are re-derived per request from the database.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const result = await verifyCredentials(body, { ip });
    const token = await createSession(result.userId, {
      userAgent: request.headers.get("user-agent"),
      ip,
    });
    const secure = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      data: { user: { id: result.userId, email: result.email }, memberships: result.memberships },
    });
    // Cookie options mirror createSession()'s server-side settings.
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    if (error instanceof ApiError) return jsonError(error);
    return jsonError(error);
  }
}
