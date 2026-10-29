import { NextResponse } from "next/server";
import { getSession, destroySession } from "@/lib/auth/session";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { AuditAction } from "@prisma/client";

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      await createAuditLog({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: AuditAction.LOGOUT,
        resource: "auth",
      });
    }
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
