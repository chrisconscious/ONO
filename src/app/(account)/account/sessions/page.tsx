import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/states";
import { SessionsManager } from "@/components/account/sessions-manager";
import { requireSession } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Active Sessions" };

export const dynamic = "force-dynamic";

export default async function AccountSessionsPage() {
  await requireSession("/account/sessions");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Active Sessions"
        description="Every device currently signed in to your account. Revoke access you do not recognise."
        breadcrumbs={[
          { label: "Account", href: "/account/profile" },
          { label: "Active Sessions" },
        ]}
      />

      <SectionCard
        title="Signed-in devices"
        description="Device names come from the browser. ONO does not collect or display location data."
      >
        <SessionsManager />
      </SectionCard>
    </div>
  );
}
