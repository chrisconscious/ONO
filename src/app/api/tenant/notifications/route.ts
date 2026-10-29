import type { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/auth/api";
import { requireTenantApi, serialise } from "@/lib/api/tenant";
import { isServiceError } from "@/lib/api/write-errors";
import {
  listNotifications,
  markNotificationRead,
} from "@/server/services/notifications/notification.service";

/** Lists in-app notifications for the signed-in member. */
export async function GET(request: NextRequest) {
  const auth = await requireTenantApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));

  try {
    const notifications = await listNotifications({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      limit,
    });
    return Response.json(serialise(notifications));
  } catch (error) {
    console.error("Notification list error:", error);
    return jsonError(500, "Unable to load notifications.");
  }
}

const markSchema = z.object({
  id: z.string().trim().max(40).optional(),
  all: z.boolean().optional(),
});

/** Marks one notification or every unread notification as read. */
export async function PATCH(request: NextRequest) {
  const auth = await requireTenantApi();
  if (auth.error) return auth.error;

  const parsed = markSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Check the request body.");

  try {
    const result = await markNotificationRead({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      id: parsed.data.id,
      all: parsed.data.all,
    });
    if (isServiceError(result)) return jsonError(400, result.error);
    return Response.json(result);
  } catch (error) {
    console.error("Notification update error:", error);
    return jsonError(500, "Unable to update notifications.");
  }
}
