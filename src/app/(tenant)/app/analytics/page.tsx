import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3Icon, ShieldAlertIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState, SectionCard } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { can, requireWorkspace } from "@/lib/auth/guards";
import { getWorkspaceAnalytics } from "@/server/services/workspace/workspace.service";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  humanise,
  pluralise,
} from "@/lib/format";

export const metadata: Metadata = { title: "Analytics" };

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>;
}) {
  const { membership } = await requireWorkspace("/app/analytics");

  if (!can(membership, "PERM-ANALYTICS.READ")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Analytics" />
        <div className="rounded-xl border border-border bg-card shadow-xs">
          <EmptyState
            icon={<ShieldAlertIcon aria-hidden="true" />}
            title="Analytics access is not granted"
            description="Your workspace role does not include analytics access. Ask a workspace administrator to review your role permissions."
          />
        </div>
      </div>
    );
  }

  const { months } = await searchParams;
  const requested = Number(months);
  const period = requested === 12 ? 12 : 6;
  const analytics = await getWorkspaceAnalytics(membership.tenantId, period);
  const maxSeries = Math.max(
    1,
    ...analytics.buckets.map((bucket) => Math.max(bucket.revenue, bucket.expenses)),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        description="Pipeline, collections and delivery figures calculated from the records stored in this workspace."
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "Analytics" },
        ]}
        actions={
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={period === 6 ? "default" : "outline"}
              render={<Link href="/app/analytics" />}
            >
              6 months
            </Button>
            <Button
              size="sm"
              variant={period === 12 ? "default" : "outline"}
              render={<Link href="/app/analytics?months=12" />}
            >
              12 months
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open pipeline"
          value={formatCurrency(analytics.totals.openPipeline)}
          hint={`${formatCurrency(analytics.totals.pipelineValue)} total recorded`}
        />
        <StatCard
          label="Won value"
          value={formatCurrency(analytics.totals.wonValue)}
          hint={`${analytics.totals.wonCount} ${pluralise(analytics.totals.wonCount, "opportunity")} closed won`}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(analytics.totals.outstanding)}
          hint="Open invoice balances"
        />
        <StatCard
          label={`Collected (${period} months)`}
          value={formatCurrency(analytics.totals.revenueInPeriod)}
          hint={`${formatCurrency(analytics.totals.expensesInPeriod)} expenses recorded`}
        />
      </div>

      <SectionCard
        title="Revenue and expenses"
        description={`Recorded payments and approved or pending expenses over the last ${period} months.`}
      >
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" aria-hidden="true" />
            Payments received
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-warning" aria-hidden="true" />
            Expenses
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 items-end gap-3 sm:grid-cols-6 xl:grid-cols-12">
          {analytics.buckets.map((bucket) => (
            <div key={bucket.key} className="flex flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end justify-center gap-1">
                <span
                  className="w-2/5 rounded-t-sm bg-primary"
                  style={{
                    height: `${Math.max(2, (bucket.revenue / maxSeries) * 100)}%`,
                  }}
                  title={`${bucket.label}: ${formatCurrency(bucket.revenue)} received`}
                />
                <span
                  className="w-2/5 rounded-t-sm bg-warning"
                  style={{
                    height: `${Math.max(2, (bucket.expenses / maxSeries) * 100)}%`,
                  }}
                  title={`${bucket.label}: ${formatCurrency(bucket.expenses)} expenses`}
                />
              </div>
              <span className="text-[0.7rem] text-muted-foreground">{bucket.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 border-t border-border pt-3 text-sm sm:grid-cols-2">
          <p className="text-muted-foreground">
            Received:{" "}
            <span className="font-medium text-foreground tabular">
              {formatCurrency(analytics.totals.revenueInPeriod)}
            </span>
          </p>
          <p className="text-muted-foreground">
            Expenses:{" "}
            <span className="font-medium text-foreground tabular">
              {formatCurrency(analytics.totals.expensesInPeriod)}
            </span>
          </p>
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Pipeline by stage"
          description="Recorded opportunity value and count in each stage."
          bodyClassName="p-0"
        >
          {analytics.pipeline.length === 0 ? (
            <EmptyState
              icon={<BarChart3Icon aria-hidden="true" />}
              title="No pipeline yet"
              description="Opportunities created in this workspace will be summarised here."
            />
          ) : (
            <TableLikeRows
              rows={analytics.pipeline.map((entry) => ({
                label: humanise(entry.stage),
                meta: `${entry.count} ${pluralise(entry.count, "opportunity")}`,
                value: formatCurrency(entry.value),
              }))}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Invoice status"
          description="Counts and outstanding balances by invoice state."
          bodyClassName="p-0"
        >
          {analytics.invoiceStatuses.length === 0 ? (
            <EmptyState
              icon={<BarChart3Icon aria-hidden="true" />}
              title="No invoices yet"
              description="Invoices raised in this workspace will be summarised here."
            />
          ) : (
            <TableLikeRows
              rows={analytics.invoiceStatuses.map((entry) => ({
                label: humanise(entry.status),
                meta: `${entry.count} ${pluralise(entry.count, "invoice")}`,
                value: formatCurrency(entry.balance),
              }))}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Delivery and support"
          description="Open work grouped by status across tasks, projects and support."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <StatusGroup title="Tasks" rows={analytics.taskStatuses} />
            <StatusGroup title="Projects" rows={analytics.projectStatuses} />
            <StatusGroup title="Support cases" rows={analytics.supportStatuses} />
          </div>
        </SectionCard>

        <SectionCard
          title="Overdue invoices"
          description="Oldest unpaid invoices past their due date."
          bodyClassName="p-0"
        >
          {analytics.overdueInvoices.length === 0 ? (
            <EmptyState
              icon={<BarChart3Icon aria-hidden="true" />}
              title="Nothing overdue"
              description="No open invoice is past its due date."
            />
          ) : (
            <ul className="divide-y divide-border">
              {analytics.overdueInvoices.map((invoice) => (
                <li
                  key={invoice.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={invoice.status} />
                    <span className="text-sm font-medium text-foreground tabular">
                      {formatCurrency(Number(invoice.balance), invoice.currency)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Figures cover {membership.tenant.name} only. There are{" "}
        {formatNumber(analytics.pipeline.length)} pipeline stages and{" "}
        {formatNumber(analytics.invoiceStatuses.length)} invoice states represented
        in this snapshot.
      </p>
    </div>
  );
}

function TableLikeRows({
  rows,
}: {
  rows: Array<{ label: string; meta: string; value: string }>;
}) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li
          key={row.label}
          className="flex items-center justify-between gap-3 px-4 py-2.5"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{row.label}</p>
            <p className="text-xs text-muted-foreground">{row.meta}</p>
          </div>
          <span className="text-sm text-foreground tabular">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

function StatusGroup({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ status: string; count: number }>;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No records.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {rows.map((row) => (
            <li key={row.status} className="flex items-center justify-between gap-2">
              <StatusBadge status={row.status} />
              <span className="text-sm text-foreground tabular">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
