import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AccountNav } from "@/components/account/account-nav";
import { PreferenceSync } from "@/components/theme/preference-sync";
import { SessionExpiryPrompt } from "@/components/auth/session-expiry-prompt";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/guards";
import {
  accountAvatarUrl,
  accountHomeHref,
  accountInitials,
  accountRoleLabel,
} from "@/lib/auth/account";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { actor, session, view, now } = await requireSession("/account/profile");
  const homeHref = accountHomeHref(actor);
  const avatarUrl = accountAvatarUrl(
    session.user.avatar?.updatedAt ?? actor.avatarUpdatedAt,
  );

  return (
    <main className="min-h-svh bg-muted/30">
      <PreferenceSync theme={actor.preferences.theme} />
      <SessionExpiryPrompt
        initialSession={{
          warningAt: view.warningAt.toISOString(),
          expiresAt: view.expiresAt.toISOString(),
          serverNow: now.toISOString(),
        }}
      />

      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href={homeHref}
            className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="ONO home"
          >
            <Logo />
          </Link>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={homeHref} />}
          >
            <ArrowLeftIcon aria-hidden="true" />
            {actor.isPlatformAdmin ? "Back to console" : "Back to workspace"}
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="lg:w-56 lg:shrink-0">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
              <Avatar size="lg" className="size-11">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {accountInitials(actor.name, actor.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {actor.name || "Signed in"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {actor.email}
                </p>
                <p className="mt-0.5 truncate text-[0.7rem] text-muted-foreground">
                  {accountRoleLabel(actor)}
                </p>
              </div>
            </div>
            <div className="mt-4 lg:rounded-xl lg:border lg:border-border lg:bg-background lg:p-1.5">
              <AccountNav />
            </div>
          </aside>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </main>
  );
}
