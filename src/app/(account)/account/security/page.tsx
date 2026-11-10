import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangleIcon,
  HistoryIcon,
  MonitorSmartphoneIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/states";
import { PasswordForm } from "@/components/account/password-form";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format";
import { listSecurityActivity } from "@/server/services/account/security.service";

export const metadata: Metadata = { title: "Security" };

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage() {
  const { actor } = await requireSession("/account/security");
  const activity = await listSecurityActivity(actor.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Security"
        description="Protect your account with a strong password and review recent security activity."
        breadcrumbs={[
          { label: "Account", href: "/account/profile" },
          { label: "Security" },
        ]}
      />

      {!actor.emailVerifiedAt ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm"
        >
          <AlertTriangleIcon
            className="mt-0.5 size-4 shrink-0 text-warning"
            aria-hidden="true"
          />
          <p>
            Your email address is not verified. Verify it from{" "}
            <Link
              href="/account/profile"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              My Profile
            </Link>{" "}
            to keep access to your account.
          </p>
        </div>
      ) : null}

      <SectionCard
        title="Password"
        description="Use at least 12 characters with uppercase, lowercase, a number and a symbol."
      >
        <PasswordForm />
      </SectionCard>

      <SectionCard
        title="Active sessions"
        description="Review the devices signed in to your account and revoke anything you do not recognise."
        action={
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/account/sessions" />}
          >
            <MonitorSmartphoneIcon aria-hidden="true" />
            Manage sessions
          </Button>
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Changing your password signs out every other device. You can also sign
          out other sessions without changing your password.
        </p>
      </SectionCard>

      <SectionCard
        title="Recent security activity"
        description="The latest sign-ins and account changes recorded for this account."
      >
        {activity.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="flex size-9 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground">
              <HistoryIcon className="size-4" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium">No security activity yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Sign-ins, password changes and profile updates will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {activity.map((event) => (
              <li
                key={event.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <ShieldCheckIcon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{event.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateTime(event.createdAt)}
                    {event.detail ? ` · ${event.detail}` : ""}
                    {event.ipAddress ? ` · ${event.ipAddress}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
