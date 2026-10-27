import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness-only endpoint. Kept for backward compatibility with existing
 * probes; dependency status lives at /api/readyz (Stage 12).
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "ono",
    timestamp: new Date().toISOString(),
  });
}
