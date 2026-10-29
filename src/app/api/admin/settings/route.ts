import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { z } from "zod";
import { jsonError, requestMeta, resolveApiActor } from "@/lib/auth/api";
import { createAuditLog } from "@/server/services/audit/audit.service";
import {
  PLATFORM_SETTING_KEYS,
  getPlatformSettings,
  savePlatformSetting,
} from "@/server/services/platform/settings.service";

export async function GET() {
  const { response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  return Response.json({ settings: await getPlatformSettings() });
}

const patchSchema = z.object({
  platformName: z.string().trim().min(1).max(80),
  supportEmail: z.string().trim().email().or(z.literal("")),
  defaultCurrency: z.string().trim().length(3).toUpperCase(),
  allowTenantSignup: z.boolean(),
  maintenanceMessage: z.string().trim().max(280),
});

export async function PATCH(request: NextRequest) {
  const { actor, response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, "Check the platform settings.", parsed.error.issues);
  }

  await Promise.all([
    savePlatformSetting({
      key: PLATFORM_SETTING_KEYS.platformName,
      value: parsed.data.platformName,
      updatedById: actor.id,
    }),
    savePlatformSetting({
      key: PLATFORM_SETTING_KEYS.supportEmail,
      value: parsed.data.supportEmail,
      updatedById: actor.id,
    }),
    savePlatformSetting({
      key: PLATFORM_SETTING_KEYS.defaultCurrency,
      value: parsed.data.defaultCurrency,
      updatedById: actor.id,
    }),
    savePlatformSetting({
      key: PLATFORM_SETTING_KEYS.allowTenantSignup,
      value: parsed.data.allowTenantSignup,
      updatedById: actor.id,
    }),
    savePlatformSetting({
      key: PLATFORM_SETTING_KEYS.maintenanceMessage,
      value: parsed.data.maintenanceMessage,
      updatedById: actor.id,
    }),
  ]);

  await createAuditLog({
    userId: actor.id,
    action: AuditAction.UPDATE,
    resource: "platform_settings",
    ...requestMeta(request),
    metadata: { keys: Object.values(PLATFORM_SETTING_KEYS) },
  });

  return Response.json({ settings: await getPlatformSettings() });
}
