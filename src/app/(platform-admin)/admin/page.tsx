import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, Building2Icon, InboxIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard, ActivityList } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState, SectionCard } from "@/components/app/states";
import { DailyBarChart, StatusBreakdown } from "@/components/app/mini-chart";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPlatformOverview } from "@/server/services/platform/overview.service";
import { formatDate, humanise, pluralise } from "@/lib/format";

export const metadata: Metadata = {
  title: "Platform overview",
};

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const overview = await getPlatformOverview();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Platform overview"
        description="Operational state of every tenant, account and governance queue on the platform."
        actions={
          <Button render={<Link href="/admin/tenants" />}>
            Manage tenants
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tenants"
          value={overview.totals.tenants}
          hint={`${overview.totals.activeTenants} active ${pluralise(overview.totals.activeTenants, "workspace")}`}
          href="/admin/tenants"
        />
        <StatCard
          label="User accounts"
          value={overview.totals.users}
          hint={`${overview.totals.platformAdmins} platform ${pluralise(overview.totals.platformAdmins, "administrator")}`}
          href="/admin/administrators"
        />
        <StatCard
          label="Active sessions"
          value={overview.totals.activeSessions}
          hint="Signed-in sessions that have not expired"
        />
        <StatCard
          label="Testimonials to review"
          value={overview.totals.pendingTestimonials}
          hint={`${overview.totals.approvedTestimonials} published on the sign-in screen`}
          href="/admin/testimonials"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <SectionCard
          title="Sign-in activity"
          description="Successful authentications recorded in the last 14 days."
        >
          <DailyBarChart
            data={overview.loginActivity}
            caption="Sign-ins per day"
          />
        </SectionCard>

        <SectionCard
          title="Tenants by status"
          description="Every tenant record grouped by lifecycle state."
        >
          <StatusBreakdown
            items={overview.statusCounts.map((item) => ({
              label: humanise(item.status),
              value: item.count,
            }))}
          />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <SectionCard
          title="Recently created tenants"
          description="The newest workspaces provisioned on the platform."
          action={
            <Button variant="ghost" size="sm" render={<Link href="/admin/tenants" />}>
              View all
            </Button>
          }
          bodyClassName="p-0"
        >
          {overview.recentTenants.length === 0 ? (
            <EmptyState
              icon={<Building2Icon aria-hidden="true" />}
              title="No tenants yet"
              description="Create the first tenant to start onboarding a customer organisation."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.recentTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <Link
                        href={`/admin/tenants/${tenant.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {tenant.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {tenant.industry ?? tenant.slug}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tenant.status} />
                    </TableCell>
                    <TableCell className="text-right tabular">
                      {tenant._count.memberships}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(tenant.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <SectionCard
          title="Recent activity"
          description="Latest entries written to the audit trail."
          action={
            <Button variant="ghost" size="sm" render={<Link href="/admin/audit" />}>
              Audit log
            </Button>
          }
        >
          {overview.recentActivity.length === 0 ? (
            <EmptyState
              icon={<InboxIcon aria-hidden="true" />}
              title="No audit entries yet"
              description="Administrative actions will appear here as they are performed."
            />
          ) : (
            <ActivityList
              emptyLabel="No audit entries yet."
              items={overview.recentActivity.map((entry) => ({
                id: entry.id,
                title: `${humanise(entry.action)} · ${humanise(entry.resource)}`,
                meta:
                  [entry.user?.name ?? entry.user?.email, entry.tenant?.name]
                    .filter(Boolean)
                    .join(" · ") || undefined,
                timestamp: entry.createdAt,
              }))}
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Tenant intake"
        description="New tenants created over the last 14 days."
      >
        <DailyBarChart
          data={overview.tenantSignups}
          caption="Tenants created per day"
        />
      </SectionCard>
    </div>
  );
}
