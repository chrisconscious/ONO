import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  LifeBuoyIcon,
  LockKeyholeIcon,
  MailCheckIcon,
  MonitorSmartphoneIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { can, requireSession } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Help & Support" };

export const dynamic = "force-dynamic";

const accountGuides = [
  {
    href: "/account/profile",
    title: "Email verification and profile changes",
    description:
      "Change your name, photo or contact number, and confirm a new email address.",
    icon: MailCheckIcon,
  },
  {
    href: "/account/security",
    title: "Password and sign-in security",
    description:
      "Update your password and review recent sign-ins and account changes.",
    icon: ShieldCheckIcon,
  },
  {
    href: "/account/sessions",
    title: "Devices with access",
    description:
      "Review every signed-in device and sign out sessions you do not recognise.",
    icon: MonitorSmartphoneIcon,
  },
] as const;

export default async function AccountSupportPage() {
  const { actor } = await requireSession("/account/support");
  const supportMembership = actor.memberships.find((membership) =>
    can(membership, "PERM-SUPPORT.READ"),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Help & Support"
        description="Find account guidance or reach your workspace support team through the existing support module."
        breadcrumbs={[
          { label: "Account", href: "/account/profile" },
          { label: "Help & Support" },
        ]}
      />

      <SectionCard
        title="Support cases"
        description="Support is handled inside your workspace so requests stay with the right team."
      >
        {supportMembership ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {supportMembership.tenant.name}
              </p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Open the support module to review existing cases or submit a new
                request. Attach the details your team needs to investigate.
              </p>
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/app/support-cases" />}
            >
              <LifeBuoyIcon aria-hidden="true" />
              Open support cases
            </Button>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 px-3.5 py-3">
            <LockKeyholeIcon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0 text-sm">
              <p className="font-medium">Support cases are not available here</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                {actor.isPlatformAdmin
                  ? "Support cases live inside each workspace. Sign in to a workspace you belong to, or ask another platform administrator for help with platform access."
                  : "Your workspace role does not include support case access. Ask a workspace administrator to review your role permissions."}
              </p>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Account guides"
        description="Resolve common account questions without raising a support case."
      >
        <ul className="divide-y divide-border">
          {accountGuides.map((guide) => {
            const Icon = guide.icon;
            return (
              <li key={guide.href}>
                <Link
                  href={guide.href}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {guide.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {guide.description}
                    </span>
                  </span>
                  <ArrowRightIcon
                    className="mt-1 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard
        title="Before you contact support"
        description="These details help your support team resolve account issues faster."
      >
        <ul className="grid gap-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <BookOpenIcon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            Note which page you were on and what you expected to happen.
          </li>
          <li className="flex items-start gap-2">
            <BookOpenIcon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            Include the email address on your account, but never send your
            password.
          </li>
          <li className="flex items-start gap-2">
            <BookOpenIcon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            For access problems, mention the workspace and the role you expect to
            use.
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
