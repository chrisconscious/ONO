import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { z } from "zod";
import {
  assertSameOrigin,
  jsonError,
  jsonNoStore,
  requestMeta,
  resolveApiActor,
} from "@/lib/auth/api";
import { createAuditLog } from "@/server/services/audit/audit.service";
import {
  AUTH_PAGE_SETTING_KEYS,
  discardAuthPageDraft,
  getAuthPageAdminState,
  publishAuthPageDraft,
  saveAuthPageDraft,
} from "@/server/services/platform/auth-page.service";

export async function GET() {
  const { response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  return jsonNoStore({ state: await getAuthPageAdminState() });
}

const contentSchema = z
  .object({
    heading: z.string().trim().min(1).max(120),
    supportingText: z.string().trim().max(240),
    smallText: z.string().trim().max(120),
    imageAlt: z.string().trim().max(160),
  })
  .strict();

export async function PATCH(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { actor, response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const parsed = contentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(
      400,
      "Check the authentication page content.",
      parsed.error.issues,
    );
  }

  const draft = await saveAuthPageDraft({
    ...parsed.data,
    actorId: actor.id,
  });

  await createAuditLog({
    userId: actor.id,
    action: AuditAction.UPDATE,
    resource: "auth_page_settings",
    ...requestMeta(request),
    metadata: {
      action: "save_draft",
      keys: [
        AUTH_PAGE_SETTING_KEYS.draftHeading,
        AUTH_PAGE_SETTING_KEYS.draftSupportingText,
        AUTH_PAGE_SETTING_KEYS.draftSmallText,
        AUTH_PAGE_SETTING_KEYS.draftImage,
      ],
    },
  });

  return jsonNoStore({ draft });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("publish") }),
  z.object({ action: z.literal("discard") }),
]);

export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { actor, response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, "Choose a valid authentication page action.");
  }

  if (parsed.data.action === "publish") {
    const published = await publishAuthPageDraft({ actorId: actor.id });

    await createAuditLog({
      userId: actor.id,
      action: AuditAction.UPDATE,
      resource: "auth_page_settings",
      ...requestMeta(request),
      metadata: { action: "publish", publishedAt: published.publishedAt },
    });

    return jsonNoStore({ published, state: await getAuthPageAdminState() });
  }

  const published = await discardAuthPageDraft();

  await createAuditLog({
    userId: actor.id,
    action: AuditAction.UPDATE,
    resource: "auth_page_settings",
    ...requestMeta(request),
    metadata: { action: "discard_draft" },
  });

  return jsonNoStore({ published, state: await getAuthPageAdminState() });
}
