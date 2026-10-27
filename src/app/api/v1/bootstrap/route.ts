import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { ApiError, jsonError } from "@/lib/api/errors";
import { ok } from "@/lib/api/tenant-route";
import { resolveSessionIdentity } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Workspace bootstrap endpoint (session-authenticated; NOT tenant-scoped).
 *
 * This route intentionally does not require X-Tenant-Id: its purpose is to
 * list the caller's memberships so the client can pick a workspace. The
 * response contains only the caller's own rows — every field is derived from
 * the server-side session and database, never from client input.
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await resolveSessionIdentity();
    if (!user) throw ApiError.unauthorized();

    const [memberships, account] = await Promise.all([
      prisma.membership.findMany({
        where: { userId: user.id, isActive: true, tenant: { isActive: true } },
        select: {
          tenantId: true,
          role: true,
          tenant: { select: { id: true, name: true, slug: true, provisioningStatus: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      // Platform role is re-read live so revocation takes effect immediately.
      prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { role: true },
      }),
    ]);

    return ok({
      user,
      platformAdmin: account.role === "PLATFORM_ADMIN",
      memberships,
    });
  } catch (error) {
    return jsonError(error);
  }
}
