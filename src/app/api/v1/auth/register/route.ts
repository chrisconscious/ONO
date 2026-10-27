import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { register } from "@/server/services/auth-service";
import { readJsonBody } from "@/lib/api/tenant-route";

export const dynamic = "force-dynamic";

/**
 * Public registration endpoint. Creates the user identity and provisions a
 * default organization (owner membership + trial subscription) through the
 * existing auth/provisioning services — no client-supplied tenant data is trusted.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const result = await register(body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
