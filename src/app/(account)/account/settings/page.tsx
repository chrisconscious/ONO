import type { Metadata } from "next";
import Link from "next/link";
import {
  MailIcon,
  MonitorSmartphoneIcon,
  PaletteIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/guards";
import { accountRoleLabel } from "@/lib/auth/account";
import { formatDate, formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Account Settings" };

export const dynamic = "force-dynamic";

const shortcuts = [
  {
    href: "/account/profile",
    label: "My Profile",
    description: "Photo, name, email and phone number.",
    icon: UserRoundIcon,
  },
  {
    href: "/account/security",
    label: "Security",
    description: "Password and recent account activity.",
    icon: ShieldCheckIcon,
  },
  {
    href: "/account/sessions",
    label: "Active Sessions",
    description: "Review and revoke signed-in devices.",
    icon: MonitorSmartphoneIcon,
  },
  {
    href: "/account/preferences",
    label: "Preferences",
    description: "Theme, language, time zone and notifications.",
    icon: PaletteIcon,
  },
] as const;

export default async function AccountSettingsPage() {
  const { session, actor } = await requireSession("/account/settings");
  const { user } = session;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Account Settings"
        description="Review the identity, access and lifecycle details attached to your ONO account."
        breadcrumbs={[
          { label: "Account", href: "/account/profile" },
          { label: "Account Settings" },
        ]}
      />

      <SectionCard
        title="Account identity"
        description="These details identify you across ONO."
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">
              Display name
            </dt>
            <dd className="mt-1 truncate text-sm font-medium">
              {user.name || "Not set"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">
              Account status
            </dt>
            <dd className="mt-1">
              <StatusBadge status={user.status} />
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">
              Email address
            </dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm font-medium">
              <span className="truncate">{user.email}</span>
              <span
                className={
                  user.emailVerifiedAt
                    ? "text-xs font-normal text-emerald-700 dark:text-emerald-400"
                    : "text-xs font-normal text-warning"
                }
              >
                {user.emailVerifiedAt ? "Verified" : "Not verified"}
              </span>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">
              Phone number
            </dt>
            <dd className="mt-1 truncate text-sm font-medium">
              {user.phone || "Not added"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">
              Account created
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {formatDate(user.createdAt)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">
              Last sign-in
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Not recorded"}
            </dd>
          </div>
        </dl>

        {user.pendingEmail ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm">
            <MailIcon className="size-4 text-warning" aria-hidden="true" />
            <span className="font-medium">{user.pendingEmail}</span>
            <span className="text-muted-foreground">
              is waiting for email confirmation.
            </span>
            <Link
              href="/account/profile"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Review change
            </Link>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Workspace access"
        description="Roles and permissions are assigned by workspace administrators."
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{accountRoleLabel(actor)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {actor.isPlatformAdmin
                  ? "Platform administrator access is granted outside any workspace."
                  : "Workspace role"}
              </p>
            </div>
            <StatusBadge status={user.status} />
          </div>

          {actor.memberships.length > 0 ? (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {actor.memberships.map((membership) => (
                <li
                  key={membership.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {membership.tenant.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {membership.roles.join(", ") || "No role assigned"}
                    </p>
                  </div>
                  <StatusBadge status={membership.tenant.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {actor.isPlatformAdmin
                ? "This account is not a member of a workspace."
                : "This account is not currently a member of a workspace."}
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Manage your account"
        description="Open a dedicated page to update a specific area."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="flex items-start gap-3 rounded-lg border border-border px-3.5 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {shortcut.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {shortcut.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Session policy"
        description="Access is rechecked on the server for every request."
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          ONO expires idle sessions automatically and requires email
          verification before sign-in. You can review every active device and
          sign out sessions you no longer trust from{" "}
          <Link
            href="/account/sessions"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Active Sessions
          </Link>
          .
        </p>
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/account/sessions" />}
          >
            <MonitorSmartphoneIcon aria-hidden="true" />
            Review active sessions
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
