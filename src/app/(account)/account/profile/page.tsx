import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ProfileForm } from "@/components/account/profile-form";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/guards";
import { accountAvatarUrl } from "@/lib/auth/account";

export const metadata: Metadata = { title: "My Profile" };

export const dynamic = "force-dynamic";

export default async function AccountProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ emailChanged?: string }>;
}) {
  const { session } = await requireSession("/account/profile");
  const { emailChanged } = await searchParams;
  const { user } = session;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Profile"
        description="Manage your photo, name and contact details. Changes are saved to your ONO account."
        breadcrumbs={[
          { label: "Account", href: "/account/profile" },
          { label: "My Profile" },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/account/settings" />}
          >
            <ArrowLeftIcon aria-hidden="true" />
            Account settings
          </Button>
        }
      />

      <ProfileForm
        emailChanged={emailChanged === "1"}
        user={{
          name: user.name ?? "",
          email: user.email,
          phone: user.phone ?? null,
          pendingEmail: user.pendingEmail ?? null,
          emailVerified: Boolean(user.emailVerifiedAt),
          createdAt: user.createdAt.toISOString(),
          avatarUrl: accountAvatarUrl(user.avatar?.updatedAt ?? null),
        }}
      />
    </div>
  );
}
