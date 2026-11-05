import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { AccountSecurityPanel } from "@/components/auth/account-security-panel";
import { PreferenceSync } from "@/components/theme/preference-sync";
import { SessionExpiryPrompt } from "@/components/auth/session-expiry-prompt";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Account security",
};

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage() {
  const { actor, view, now } = await requireSession("/account/security");
  const homeHref = actor.isPlatformAdmin
    ? "/admin"
    : actor.memberships.length > 0
      ? "/app"
      : "/sign-in";

  if (homeHref === "/sign-in") redirect(homeHref);

  return (
    <main className="min-h-svh bg-muted/30 px-4 py-8 sm:px-6">
      <PreferenceSync theme={actor.preferences.theme} />
      <SessionExpiryPrompt
        initialSession={{
          warningAt: view.warningAt.toISOString(),
          expiresAt: view.expiresAt.toISOString(),
          serverNow: now.toISOString(),
        }}
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">ONO account</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Profile and security
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your account details, sign-in security and preferences.
            </p>
          </div>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={homeHref} />}
          >
            {actor.isPlatformAdmin ? "Back to console" : "Back to workspace"}
          </Button>
        </header>

        <AccountSecurityPanel
          user={{
            name: actor.name ?? "",
            email: actor.email,
            emailVerified: Boolean(actor.emailVerifiedAt),
            status: actor.status,
            preferences: actor.preferences,
          }}
        />
      </div>
    </main>
  );
}
