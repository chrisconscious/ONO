import { prisma } from "@/lib/database/prisma";

export const PLATFORM_SETTING_KEYS = {
  platformName: "platform.name",
  supportEmail: "platform.supportEmail",
  defaultCurrency: "platform.defaultCurrency",
  allowTenantSignup: "platform.allowTenantSelfSignup",
  maintenanceMessage: "platform.maintenanceMessage",
} as const;

export type PlatformSettingsView = {
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
  allowTenantSignup: boolean;
  maintenanceMessage: string;
};

const defaults: PlatformSettingsView = {
  platformName: "ONO",
  supportEmail: "",
  defaultCurrency: "TZS",
  allowTenantSignup: false,
  maintenanceMessage: "",
};

/** Reads stored platform configuration, falling back to documented defaults. */
export async function getPlatformSettings(): Promise<PlatformSettingsView> {
  const rows = await prisma.platformSetting.findMany();
  const stored = new Map(rows.map((row) => [row.key, row.value]));

  const readString = (key: string, fallback: string) => {
    const value = stored.get(key);
    return typeof value === "string" ? value : fallback;
  };

  const signup = stored.get(PLATFORM_SETTING_KEYS.allowTenantSignup);

  return {
    platformName: readString(PLATFORM_SETTING_KEYS.platformName, defaults.platformName),
    supportEmail: readString(PLATFORM_SETTING_KEYS.supportEmail, defaults.supportEmail),
    defaultCurrency: readString(
      PLATFORM_SETTING_KEYS.defaultCurrency,
      defaults.defaultCurrency,
    ),
    allowTenantSignup: typeof signup === "boolean" ? signup : defaults.allowTenantSignup,
    maintenanceMessage: readString(
      PLATFORM_SETTING_KEYS.maintenanceMessage,
      defaults.maintenanceMessage,
    ),
  };
}

export async function savePlatformSetting(params: {
  key: string;
  value: string | boolean;
  updatedById: string;
  description?: string;
}) {
  return prisma.platformSetting.upsert({
    where: { key: params.key },
    create: {
      key: params.key,
      value: params.value,
      description: params.description,
      updatedById: params.updatedById,
    },
    update: {
      value: params.value,
      updatedById: params.updatedById,
    },
  });
}
