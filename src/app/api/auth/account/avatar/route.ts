import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth/session";
import {
  assertSameOrigin,
  jsonError,
  jsonNoStore,
  requestMeta,
} from "@/lib/auth/api";
import { createAuditLog } from "@/server/services/audit/audit.service";
import {
  AssetValidationError,
  getUserAvatar,
  removeUserAvatar,
  storeUserAvatar,
} from "@/server/services/account/avatar.service";

export const dynamic = "force-dynamic";

/** Serves the authenticated account's own avatar bytes. */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) return jsonError(401, "Authentication required.");

  const avatar = await getUserAvatar(session.user.id);
  if (!avatar) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(avatar.data), {
    status: 200,
    headers: {
      "Content-Type": avatar.mimeType,
      "Content-Length": String(avatar.byteSize),
      "Cache-Control": "private, no-store, no-cache, must-revalidate",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** Uploads or replaces the avatar for the authenticated account. */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const session = await getCurrentSession();
  if (!session) return jsonError(401, "Authentication required.");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || typeof file === "string") {
    return jsonError(400, "Choose an image file to upload.");
  }

  try {
    const avatar = await storeUserAvatar(session.user.id, file);

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: "user",
      resourceId: session.user.id,
      ...requestMeta(request),
      metadata: {
        event: "avatar_uploaded",
        mimeType: avatar.mimeType,
        byteSize: avatar.byteSize,
      },
    });

    return jsonNoStore({
      ok: true,
      message: "Profile photo updated.",
      avatarUrl: `/api/auth/account/avatar?v=${avatar.updatedAt.getTime()}`,
    });
  } catch (error) {
    if (error instanceof AssetValidationError) {
      return jsonError(400, error.message);
    }

    console.error(
      "Avatar upload error:",
      error instanceof Error ? error.message : "unknown failure",
    );
    return jsonError(503, "The photo could not be saved. Please try again.");
  }
}

/** Removes the authenticated account's avatar. */
export async function DELETE(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const session = await getCurrentSession();
  if (!session) return jsonError(401, "Authentication required.");

  await removeUserAvatar(session.user.id);

  await createAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: AuditAction.DELETE,
    resource: "user",
    resourceId: session.user.id,
    ...requestMeta(request),
    metadata: { event: "avatar_removed" },
  });

  return jsonNoStore({ ok: true, message: "Profile photo removed." });
}
