import { prisma } from "@/lib/database/prisma";
import {
  AssetValidationError,
  sniffImageMime,
} from "@/server/services/platform/assets.service";

/** Avatars are small; the header loads them on every page. */
export const USER_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export { AssetValidationError };

/**
 * Validates the image by its file signature, never the browser-supplied MIME
 * type, then replaces the caller's stored avatar bytes.
 */
export async function storeUserAvatar(userId: string, file: File) {
  if (!(file instanceof File) || file.size === 0) {
    throw new AssetValidationError("Choose an image file to upload.");
  }

  if (file.size > USER_AVATAR_MAX_BYTES) {
    throw new AssetValidationError("Profile photos must be 2 MB or smaller.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = sniffImageMime(buffer);

  if (!mimeType) {
    throw new AssetValidationError(
      "Upload a JPG, PNG or WebP image. Other file types are not accepted.",
    );
  }

  return prisma.userAvatar.upsert({
    where: { userId },
    create: {
      userId,
      mimeType,
      byteSize: buffer.byteLength,
      data: buffer,
    },
    update: {
      mimeType,
      byteSize: buffer.byteLength,
      data: buffer,
    },
    select: { userId: true, mimeType: true, byteSize: true, updatedAt: true },
  });
}

export async function getUserAvatar(userId: string) {
  return prisma.userAvatar.findUnique({
    where: { userId },
    select: { mimeType: true, byteSize: true, data: true, updatedAt: true },
  });
}

export async function removeUserAvatar(userId: string) {
  await prisma.userAvatar.deleteMany({ where: { userId } });
}
