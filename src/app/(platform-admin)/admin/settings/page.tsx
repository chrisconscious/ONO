import type { Metadata } from "next";
import { ShieldCheckIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/states";
import { PlatformSettingsForm } from "@/components/platform/platform-settings-form";
import { getPlatformSettings } from "@/server/services/platform/settings.service";
import { getCurrentActor } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Platform settings",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, actor] = await Promise.all([
    getPlatformSettings(),
    getCurrentActor(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Platform settings"
        description="Configuration shared by every tenant. Changes take effect immediately and are written to the audit log."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <SectionCard
          title="General configuration"
          description="Identity, support and operational defaults for the platform."
        >
          <PlatformSettingsForm initialSettings={settings} />
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard title="Governance">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2.5">
                <ShieldCheckIcon
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  Settings are stored in the platform configuration table, not in
                  code or environment files.
                </span>
              </li>
              <li className="flex gap-2.5">
                <ShieldCheckIcon
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  Every save records the acting administrator, timestamp and the
                  keys that changed.
                </span>
              </li>
              <li className="flex gap-2.5">
                <ShieldCheckIcon
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  Tenant administrators cannot read or modify platform
                  configuration.
                </span>
              </li>
            </ul>
          </SectionCard>

          <SectionCard title="Current operator">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Signed in as</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {actor?.name ?? actor?.email}
                </dd>
                <dd className="text-xs text-muted-foreground">{actor?.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Verified role</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  Platform administrator
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
