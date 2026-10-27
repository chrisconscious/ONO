import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { destroyCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Revokes the current server-side session row and clears the cookie. */
export async function POST(_request: NextRequest): Promise<Response> {
  try {
    await destroyCurrentSession();
    return NextResponse.json({ data: { loggedOut: true } });
  } catch (error) {
    return jsonError(error);
  }
}
