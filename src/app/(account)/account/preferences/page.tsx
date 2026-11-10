import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/states";
import { PreferencesForm } from "@/components/account/preferences-form";
import { requireSession } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Preferences" };

export const dynamic = "force-dynamic";

export default async function AccountPreferencesPage() {
  const { actor } = await requireSession("/account/preferences");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Preferences"
        description="Choose how ONO looks and how it contacts you. These settings follow your account across devices."
        breadcrumbs={[
          { label: "Account", href: "/account/profile" },
          { label: "Preferences" },
        ]}
      />

      <SectionCard
        title="Your preferences"
        description="Stored on your user account and restored after every sign-in."
      >
        <PreferencesForm initialPreferences={actor.preferences} />
      </SectionCard>
    </div>
  );
}
