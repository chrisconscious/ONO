import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlertIcon } from "lucide-react";
import { getCurrentActor } from "@/lib/auth/guards";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Access denied",
  description: "Your account does not have access to this area.",
};

export const dynamic = "force-dynamic";

/**
 * Shown when an authenticated account lacks the permission required for a
 * console. The decision is always derived from the server-side session.
 */
export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const [{ scope }, actor] = await Promise.all([
    searchParams,
    getCurrentActor(),
  ]);

  const workspaceScope = scope === "workspace";
  const suspendedScope = scope === "suspended";

  const title = suspendedScope
    ? "This workspace is unavailable"
    : workspaceScope
      ? "You do not have an active workspace"
      : "You do not have platform access";

  const description = suspendedScope
    ? "Your organisation's workspace is suspended or closed. Sign-in details are correct, but business routes are blocked until a platform administrator restores the tenant."
    : workspaceScope
      ? "This area belongs to a tenant workspace. Your account is not an active member of any workspace, or your membership has been suspended."
      : "Platform administration is limited to accounts with a verified platform administrator role. Tenant administrators cannot open the platform console.";

  return (
    <main className="flex min-h-svh flex-col bg-background">
      <header className="flex h-16 items-center border-b border-border px-6">
        <Logo />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-xs">
          <div className="flex size-11 items-center justify-center rounded-full border border-warning/30 bg-warning/10 text-warning">
            <ShieldAlertIcon className="size-5" aria-hidden="true" />
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          {actor ? (
            <p className="mt-4 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">{actor.email}</span>
              {actor.isPlatformAdmin ? " · Platform administrator" : ""}
            </p>
          ) : (
            <p className="mt-4 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              You are not signed in. Sign in with an authorised account to
              continue.
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {!actor ? (
              <Button render={<Link href="/login" />}>Sign in</Button>
            ) : null}
            {actor?.memberships.length ? (
              <Button render={<Link href="/app" />}>Open workspace</Button>
            ) : null}
            {actor?.isPlatformAdmin ? (
              <Button render={<Link href="/admin" />}>Open platform console</Button>
            ) : null}
            {actor ? <SignOutButton /> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
