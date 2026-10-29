import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  UsersIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { GettingStarted } from "@/components/app/onboarding";
import { StatCard, ActivityList } from "@/components/app/stat-card";
import { EmptyState, SectionCard } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { requireWorkspace, can } from "@/lib/auth/guards";
import { getWorkspaceOverview } from "@/server/services/workspace/workspace.service";
import {
  formatCurrency,
  formatDate,
  formatRelative,
  humanise,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Workspace overview",
};

export const dynamic = "force-dynamic";

export default async function WorkspaceOverviewPage() {
  const { membership } = await requireWorkspace("/app");
  const overview = await getWorkspaceOverview(membership.tenantId);
  const { totals } = overview;

  const canReadLeads = can(membership, "PERM-LEAD.READ");
  const canReadTasks = can(membership, "PERM-TASK.READ");
  const canReadInvoices = can(membership, "PERM-INVOICE.READ");
  const canReadAnalytics = can(membership, "PERM-ANALYTICS.READ");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${membership.tenant.name} overview`}
        description="Operational picture for this workspace: pipeline, delivery work, customer records and money."
        actions={
          canReadLeads ? (
            <Button render={<Link href="/app/leads" />}>
              Open leads
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          ) : undefined
        }
      />

      <GettingStarted
        showCrm={canReadLeads}
        showSales={canReadInvoices}
        showAnalytics={canReadAnalytics}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Leads"
          value={totals.leads}
          hint={`${totals.qualifiedLeads} qualified or converted`}
          href={canReadLeads ? "/app/leads" : undefined}
        />
        <StatCard
          label="Open tasks"
          value={totals.openTasks}
          hint={
            totals.overdueTasks > 0
              ? `${totals.overdueTasks} overdue`
              : "Nothing overdue"
          }
          href={canReadTasks ? "/app/tasks" : undefined}
        />
        <StatCard
          label="Outstanding invoices"
          value={formatCurrency(totals.outstandingBalance)}
          hint={`${totals.openInvoices} invoices awaiting payment`}
        />
        <StatCard
          label="Collected revenue"
          value={formatCurrency(totals.collectedRevenue)}
          hint={`${totals.paidInvoices} paid invoices`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Contacts" value={totals.contacts} />
        <StatCard label="Companies" value={totals.companies} />
        <StatCard label="Opportunities" value={totals.opportunities} />
        <StatCard label="Active projects" value={totals.projects} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Recent leads"
          description="The newest enquiries captured in this workspace."
          action={
            canReadLeads ? (
              <Button variant="ghost" size="sm" render={<Link href="/app/leads" />}>
                View all
              </Button>
            ) : null
          }
          bodyClassName="p-0"
        >
          {overview.recentLeads.length === 0 ? (
            <EmptyState
              icon={<UsersIcon aria-hidden="true" />}
              title="No leads captured"
              description={
                canReadLeads
                  ? "Add the first lead to start tracking the pipeline."
                  : "Leads recorded in this workspace will appear here."
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {overview.recentLeads.map((lead) => (
                <li key={lead.id} className="px-4 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <StatusBadge status={lead.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {lead.companyName ?? "No company"} · added{" "}
                    {formatRelative(lead.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Work in progress"
          description="Open tasks ordered by due date."
          action={
            canReadTasks ? (
              <Button variant="ghost" size="sm" render={<Link href="/app/tasks" />}>
                View all
              </Button>
            ) : null
          }
          bodyClassName="p-0"
        >
          {overview.upcomingTasks.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2Icon aria-hidden="true" />}
              title="Nothing outstanding"
              description="There are no open tasks in this workspace."
            />
          ) : (
            <ul className="divide-y divide-border">
              {overview.upcomingTasks.map((task) => {
                const overdue = task.isOverdue;

                return (
                  <li key={task.id} className="px-4 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {task.title}
                      </p>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {task.assignee?.name ?? task.assignee?.email ?? "Unassigned"}
                      {task.dueDate ? (
                        <span className={overdue ? "text-destructive" : undefined}>
                          {" "}
                          · due {formatDate(task.dueDate)}
                          {overdue ? " (overdue)" : ""}
                        </span>
                      ) : (
                        " · no due date"
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Workspace activity"
          description="Recent governance events in this tenant."
          bodyClassName="p-0 px-4 py-3"
        >
          {overview.recentActivity.length === 0 ? (
            <EmptyState
              icon={<ClipboardListIcon aria-hidden="true" />}
              title="No activity yet"
              description="Actions performed in this workspace will be recorded here."
            />
          ) : (
            <ActivityList
              emptyLabel="No activity recorded."
              items={overview.recentActivity.map((entry) => ({
                id: entry.id,
                title: `${humanise(entry.action)} · ${humanise(entry.resource)}`,
                meta: entry.user?.name ?? entry.user?.email ?? "System",
                timestamp: entry.createdAt,
              }))}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
