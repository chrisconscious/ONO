import type { NextRequest } from "next/server";
import { getCurrentActor } from "@/lib/auth/session";
import { getPlatformAsset } from "@/server/services/platform/assets.service";
import { getPublishedAuthPage } from "@/server/services/platform/auth-page.service";

/**
 * Serves the active authentication-page image. Draft uploads are visible only
 * to an authenticated platform administrator so previewing never leaks an
 * unpublished asset.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const asset = await getPlatformAsset(id);

  if (!asset || asset.kind !== "auth-page") {
    return new Response("Not found", { status: 404 });
  }

  const published = await getPublishedAuthPage();
  const isPublished = published.image.assetId === asset.id;

  if (!isPublished) {
    const actor = await getCurrentActor();
    if (!actor?.isPlatformAdmin) {
      return new Response("Not found", { status: 404 });
    }
  }

  return new Response(asset.data, {
    status: 200,
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.byteSize),
      "Content-Disposition": `inline; filename="${asset.fileName}"`,
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Cache-Control": isPublished
        ? "public, max-age=300, must-revalidate"
        : "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
