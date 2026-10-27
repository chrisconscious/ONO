import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness probe: process is up and able to serve HTTP. Deliberately does
 * NOT touch the database — a dead DB should trigger readiness removal and
 * alerts, not a restart storm that loses in-flight requests.
 */
export function GET() {
  return NextResponse.json(
    { status: "alive" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
