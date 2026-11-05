import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { deletePlatformAsset } from "./assets.service";

export const AUTH_PAGE_SETTING_KEYS = {
  heading: "auth.heading",
  supportingText: "auth.supportingText",
  smallText: "auth.smallText",
  image: "auth.image",
  publishedAt: "auth.publishedAt",
  draftHeading: "auth.draft.heading",
  draftSupportingText: "auth.draft.supportingText",
  draftSmallText: "auth.draft.smallText",
  draftImage: "auth.draft.image",
  draftSavedAt: "auth.draft.savedAt",
} as const;

export const AUTH_PAGE_DEFAULT_IMAGE = "/media/login-team.jpg";

const draftKeys = [
  AUTH_PAGE_SETTING_KEYS.draftHeading,
  AUTH_PAGE_SETTING_KEYS.draftSupportingText,
  AUTH_PAGE_SETTING_KEYS.draftSmallText,
  AUTH_PAGE_SETTING_KEYS.draftImage,
  AUTH_PAGE_SETTING_KEYS.draftSavedAt,
];

export type AuthPageText = {
  heading: string;
  supportingText: string;
  smallText: string;
};

export type AuthPageImageSetting = {
  assetId: string | null;
  alt: string;
  useDefault: boolean;
  updatedAt: string | null;
};

export type AuthPageImageView = {
  url: string | null;
  alt: string;
  source: "default" | "upload" | "none";
  assetId: string | null;
  updatedAt: string | null;
};

export type AuthPageView = AuthPageText & {
  image: AuthPageImageView;
  publishedAt: string | null;
};

export type AuthPageDraftView = AuthPageView & {
  hasDraft: boolean;
  draftSavedAt: string | null;
};

export type AuthPageAdminState = {
  draft: AuthPageDraftView;
  published: AuthPageView;
};

export const AUTH_PAGE_DEFAULTS: AuthPageText = {
  heading: "Manage your business. Grow without limits.",
  supportingText: "",
  smallText: "Multi-tenant business operations platform",
};

const defaultImage: AuthPageImageSetting = {
  assetId: null,
  alt: "",
  useDefault: true,
  updatedAt: null,
};

type SettingMap = Map<string, Prisma.JsonValue>;

function readString(map: SettingMap, key: string, fallback: string) {
  const value = map.get(key);
  return typeof value === "string" ? value : fallback;
}

function readImage(
  map: SettingMap,
  key: string,
  fallback: AuthPageImageSetting,
): AuthPageImageSetting {
  const value = map.get(key);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const assetId = typeof record.assetId === "string" ? record.assetId : null;
  const useDefault =
    typeof record.useDefault === "boolean" ? record.useDefault : fallback.useDefault;

  return {
    assetId,
    alt: typeof record.alt === "string" ? record.alt : fallback.alt,
    // A stored asset always wins over the default image.
    useDefault: assetId ? false : useDefault,
    updatedAt:
      typeof record.updatedAt === "string" ? record.updatedAt : fallback.updatedAt,
  };
}

function toImageView(image: AuthPageImageSetting): AuthPageImageView {
  if (image.assetId) {
    return {
      url: `/api/auth-page/image/${image.assetId}`,
      alt: image.alt,
      source: "upload",
      assetId: image.assetId,
      updatedAt: image.updatedAt,
    };
  }

  return {
    url: image.useDefault ? AUTH_PAGE_DEFAULT_IMAGE : null,
    alt: image.alt,
    source: image.useDefault ? "default" : "none",
    assetId: null,
    updatedAt: image.updatedAt,
  };
}

async function loadSettings() {
  const rows = await prisma.platformSetting.findMany();
  return new Map(rows.map((row) => [row.key, row.value]));
}

function publishedFrom(map: SettingMap): {
  text: AuthPageText;
  image: AuthPageImageSetting;
  publishedAt: string | null;
} {
  const publishedAt = map.get(AUTH_PAGE_SETTING_KEYS.publishedAt);

  return {
    text: {
      heading: readString(
        map,
        AUTH_PAGE_SETTING_KEYS.heading,
        AUTH_PAGE_DEFAULTS.heading,
      ),
      supportingText: readString(
        map,
        AUTH_PAGE_SETTING_KEYS.supportingText,
        AUTH_PAGE_DEFAULTS.supportingText,
      ),
      smallText: readString(
        map,
        AUTH_PAGE_SETTING_KEYS.smallText,
        AUTH_PAGE_DEFAULTS.smallText,
      ),
    },
    image: readImage(map, AUTH_PAGE_SETTING_KEYS.image, defaultImage),
    publishedAt: typeof publishedAt === "string" ? publishedAt : null,
  };
}

function toPublishedView(map: SettingMap): AuthPageView {
  const published = publishedFrom(map);
  return {
    ...published.text,
    image: toImageView(published.image),
    publishedAt: published.publishedAt,
  };
}

function draftFrom(map: SettingMap) {
  const published = publishedFrom(map);
  const savedAt = map.get(AUTH_PAGE_SETTING_KEYS.draftSavedAt);
  const hasDraft = typeof savedAt === "string";

  return {
    text: {
      heading: hasDraft
        ? readString(
            map,
            AUTH_PAGE_SETTING_KEYS.draftHeading,
            published.text.heading,
          )
        : published.text.heading,
      supportingText: hasDraft
        ? readString(
            map,
            AUTH_PAGE_SETTING_KEYS.draftSupportingText,
            published.text.supportingText,
          )
        : published.text.supportingText,
      smallText: hasDraft
        ? readString(
            map,
            AUTH_PAGE_SETTING_KEYS.draftSmallText,
            published.text.smallText,
          )
        : published.text.smallText,
    },
    image: hasDraft
      ? readImage(map, AUTH_PAGE_SETTING_KEYS.draftImage, published.image)
      : published.image,
    hasDraft,
    draftSavedAt: hasDraft ? String(savedAt) : null,
  };
}

/** Public content for the authentication screens. */
export async function getPublishedAuthPage(): Promise<AuthPageView> {
  return toPublishedView(await loadSettings());
}

/** Draft plus published state for the authenticated settings screen. */
export async function getAuthPageAdminState(): Promise<AuthPageAdminState> {
  const map = await loadSettings();
  const published = publishedFrom(map);
  const draft = draftFrom(map);

  return {
    published: toPublishedView(map),
    draft: {
      ...draft.text,
      image: toImageView(draft.image),
      publishedAt: published.publishedAt,
      hasDraft: draft.hasDraft,
      draftSavedAt: draft.draftSavedAt,
    },
  };
}

/** Admin preview: the saved draft when present, otherwise the live content. */
export async function getAuthPagePreview(): Promise<AuthPageDraftView> {
  const state = await getAuthPageAdminState();
  return state.draft;
}

function upsertSetting(
  key: string,
  value: Prisma.InputJsonValue,
  actorId: string,
  description?: string,
) {
  return prisma.platformSetting.upsert({
    where: { key },
    create: { key, value, updatedById: actorId, description },
    update: { value, updatedById: actorId },
  });
}

export async function saveAuthPageDraft(params: {
  heading: string;
  supportingText: string;
  smallText: string;
  imageAlt?: string;
  actorId: string;
}) {
  const map = await loadSettings();
  const draft = draftFrom(map);
  const image: AuthPageImageSetting = {
    ...draft.image,
    alt: params.imageAlt ?? draft.image.alt,
  };
  const now = new Date().toISOString();

  await prisma.$transaction([
    upsertSetting(
      AUTH_PAGE_SETTING_KEYS.draftHeading,
      params.heading,
      params.actorId,
      "Authentication page heading (draft)",
    ),
    upsertSetting(
      AUTH_PAGE_SETTING_KEYS.draftSupportingText,
      params.supportingText,
      params.actorId,
      "Authentication page supporting text (draft)",
    ),
    upsertSetting(
      AUTH_PAGE_SETTING_KEYS.draftSmallText,
      params.smallText,
      params.actorId,
      "Authentication page small text (draft)",
    ),
    upsertSetting(
      AUTH_PAGE_SETTING_KEYS.draftImage,
      image as unknown as Prisma.InputJsonValue,
      params.actorId,
      "Authentication page image (draft)",
    ),
    upsertSetting(
      AUTH_PAGE_SETTING_KEYS.draftSavedAt,
      now,
      params.actorId,
      "Authentication page draft saved at",
    ),
  ]);

  return getAuthPagePreview();
}

export async function setAuthPageDraftImage(params: {
  assetId: string | null;
  alt?: string;
  useDefault: boolean;
  actorId: string;
}) {
  const map = await loadSettings();
  const published = publishedFrom(map);
  const draft = draftFrom(map);
  const image: AuthPageImageSetting = {
    assetId: params.assetId,
    alt: params.alt ?? draft.image.alt,
    useDefault: params.assetId ? false : params.useDefault,
    updatedAt: new Date().toISOString(),
  };

  await prisma.$transaction([
    upsertSetting(
      AUTH_PAGE_SETTING_KEYS.draftImage,
      image as unknown as Prisma.InputJsonValue,
      params.actorId,
      "Authentication page image (draft)",
    ),
    upsertSetting(
      AUTH_PAGE_SETTING_KEYS.draftSavedAt,
      new Date().toISOString(),
      params.actorId,
      "Authentication page draft saved at",
    ),
  ]);

  if (
    draft.image.assetId &&
    draft.image.assetId !== published.image.assetId
  ) {
    await deleteAssetIfUnreferenced(draft.image.assetId);
  }

  return getAuthPagePreview();
}

export async function publishAuthPageDraft(params: { actorId: string }) {
  const map = await loadSettings();
  const published = publishedFrom(map);
  const draft = draftFrom(map);
  const now = new Date().toISOString();

  await prisma.$transaction([
    upsertSetting(
      AUTH_PAGE_SETTING_KEYS.heading,
      draft.text.heading,
      params.actorId,
      "Authentication page heading",
    ),
    upsertSetting(
      AUTH_PAGE_SETTING_KEYS.supportingText,
      draft.text.supportingText,
      params.actorId,
      "Authentication page supporting text",
    ),
    upsertSetting(
      AUTH_PAGE_SETTING_KEYS.smallText,
      draft.text.smallText,
      params.actorId,
      "Authentication page small text",
    ),
    upsertSetting(
      AUTH_PAGE_SETTING_KEYS.image,
      draft.image as unknown as Prisma.InputJsonValue,
      params.actorId,
      "Authentication page image",
    ),
    upsertSetting(
      AUTH_PAGE_SETTING_KEYS.publishedAt,
      now,
      params.actorId,
      "Authentication page last published at",
    ),
    prisma.platformSetting.deleteMany({ where: { key: { in: draftKeys } } }),
  ]);

  if (
    published.image.assetId &&
    published.image.assetId !== draft.image.assetId
  ) {
    await deleteAssetIfUnreferenced(published.image.assetId);
  }

  return getPublishedAuthPage();
}

export async function discardAuthPageDraft() {
  const map = await loadSettings();
  const published = publishedFrom(map);
  const draft = draftFrom(map);

  await prisma.platformSetting.deleteMany({
    where: { key: { in: draftKeys } },
  });

  if (
    draft.image.assetId &&
    draft.image.assetId !== published.image.assetId
  ) {
    await deleteAssetIfUnreferenced(draft.image.assetId);
  }

  return getPublishedAuthPage();
}

/** Deletes an uploaded image once neither the draft nor the live page uses it. */
async function deleteAssetIfUnreferenced(assetId: string) {
  const rows = await prisma.platformSetting.findMany({
    where: {
      key: {
        in: [AUTH_PAGE_SETTING_KEYS.image, AUTH_PAGE_SETTING_KEYS.draftImage],
      },
    },
    select: { value: true },
  });

  const referenced = rows.some((row) => {
    const value = row.value;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }
    return (value as Record<string, unknown>).assetId === assetId;
  });

  if (!referenced) {
    await deletePlatformAsset(assetId);
  }
}
