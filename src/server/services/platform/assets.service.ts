import { prisma } from "@/lib/database/prisma";

export const AUTH_PAGE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export type AllowedImageMime = "image/jpeg" | "image/png" | "image/webp";

const extensionByMime: Record<AllowedImageMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Reads the file signature instead of trusting the browser-supplied type.
 * Only the raster formats supported by the authentication page are accepted;
 * SVG is deliberately excluded because it can carry active content.
 */
export function sniffImageMime(bytes: Uint8Array): AllowedImageMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  const isWebp =
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50; // P

  return isWebp ? "image/webp" : null;
}

export class AssetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssetValidationError";
  }
}

function safeFileName(name: string, mimeType: AllowedImageMime) {
  const base = name
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.replace(/[^A-Za-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

  if (!base || base === "." || base === "..") {
    return `auth-page.${extensionByMime[mimeType]}`;
  }

  return base.includes(".") ? base : `${base}.${extensionByMime[mimeType]}`;
}

/**
 * Validates and stores an authentication-page image. The database stores the
 * bytes; callers receive only non-sensitive metadata.
 */
export async function storeAuthPageImage(file: File) {
  if (!(file instanceof File) || file.size === 0) {
    throw new AssetValidationError("Choose an image file to upload.");
  }

  if (file.size > AUTH_PAGE_IMAGE_MAX_BYTES) {
    throw new AssetValidationError("Images must be 5 MB or smaller.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = sniffImageMime(buffer);

  if (!mimeType) {
    throw new AssetValidationError(
      "Upload a JPG, PNG or WebP image. Other file types are not accepted.",
    );
  }

  return prisma.platformAsset.create({
    data: {
      kind: "auth-page",
      fileName: safeFileName(file.name, mimeType),
      mimeType,
      byteSize: buffer.byteLength,
      data: buffer,
    },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      byteSize: true,
      createdAt: true,
    },
  });
}

export async function getPlatformAsset(id: string) {
  return prisma.platformAsset.findUnique({ where: { id } });
}

export async function deletePlatformAsset(id: string) {
  await prisma.platformAsset.deleteMany({ where: { id } });
}
