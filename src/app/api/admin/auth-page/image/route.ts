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
  AssetValidationError,
  storeAuthPageImage,
} from "@/server/services/platform/assets.service";
import {
  getAuthPagePreview,
  setAuthPageDraftImage,
} from "@/server/services/platform/auth-page.service";

/** Uploads a new draft image. Nothing is visible publicly until publication. */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { actor, response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || typeof file === "string") {
    return jsonError(400, "Choose an image file to upload.");
  }

  try {
    const current = await getAuthPagePreview();
    const asset = await storeAuthPageImage(file);
    const draft = await setAuthPageDraftImage({
      assetId: asset.id,
      alt: current.image.alt,
      useDefault: false,
      actorId: actor.id,
    });

    await createAuditLog({
      userId: actor.id,
      action: AuditAction.UPDATE,
      resource: "auth_page_settings",
      resourceId: asset.id,
      ...requestMeta(request),
      metadata: {
        action: "upload_image",
        assetId: asset.id,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        byteSize: asset.byteSize,
      },
    });

    return jsonNoStore({ draft, upload: asset });
  } catch (error) {
    if (error instanceof AssetValidationError) {
      return jsonError(400, error.message);
    }

    console.error("Authentication page image upload failed:", error);
    return jsonError(500, "The image could not be stored. Try again.");
  }
}

/** Removes the draft image. The live image is unaffected until publication. */
export async function DELETE(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { actor, response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const draft = await setAuthPageDraftImage({
    assetId: null,
    useDefault: false,
    actorId: actor.id,
  });

  await createAuditLog({
    userId: actor.id,
    action: AuditAction.UPDATE,
    resource: "auth_page_settings",
    ...requestMeta(request),
    metadata: { action: "remove_image_draft" },
  });

  return jsonNoStore({ draft });
}

const restoreSchema = z.object({ action: z.literal("restore_default") });

/** Restores the bundled default image in the draft. */
export async function PATCH(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { actor, response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const parsed = restoreSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, "Choose a valid image action.");
  }

  const draft = await setAuthPageDraftImage({
    assetId: null,
    useDefault: true,
    actorId: actor.id,
  });

  await createAuditLog({
    userId: actor.id,
    action: AuditAction.UPDATE,
    resource: "auth_page_settings",
    ...requestMeta(request),
    metadata: { action: "restore_default_image_draft" },
  });

  return jsonNoStore({ draft });
}
