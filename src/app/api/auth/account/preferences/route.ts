import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import {
  assertSameOrigin,
  jsonError,
  jsonNoStore,
  requestMeta,
} from "@/lib/auth/api";
import { parsePreferences, preferencesSchema } from "@/lib/auth/validation";
import { createAuditLog } from "@/server/services/audit/audit.service";

export const dynamic = "force-dynamic";

/**
 * Persists presentation preferences. These values never influence
 * authorization; they only restore the user's chosen workspace experience.
 */
export async function PUT(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const session = await getCurrentSession();
    if (!session) return jsonError(401, "Authentication required.");

    const body = await request.json().catch(() => null);
    const existing = parsePreferences(session.user.preferences);
    const merged =
      body && typeof body === "object"
        ? { ...existing, ...(body as Record<string, unknown>) }
        : existing;

    const parsed = preferencesSchema.safeParse(merged);
    if (!parsed.success) {
      return jsonNoStore(
        {
          error: "Check the highlighted preference and try again.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { preferences: parsed.data },
    });

    const { ipAddress, userAgent } = requestMeta(request);
    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: "user",
      resourceId: session.user.id,
      ipAddress,
      userAgent,
      metadata: { event: "preferences_updated" },
    });

    return jsonNoStore({ ok: true, preferences: parsed.data });
  } catch (error) {
    console.error(
      "Preferences update error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(503, "Your preferences could not be saved. Please try again.");
  }
}
