import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CircleAlertIcon,
  DatabaseIcon,
  FlameIcon,
  ShieldAlertIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
  WorkflowIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState, InlineAlert, SectionCard } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import {
  CrmAccessDenied,
  RecordLink,
} from "@/components/workspace/crm-panels";import { CrmCopilotPanel } from "@/components/workspace/crm-copilot";
import { can, requireWorkspace } from "@/lib/auth/guards";
import { formatCurrencyTotals, hasDatePassed } from "@/lib/crm/presentation";
import {
  formatDate,
  formatNumber,
  formatRelative,
  humanise,
  pluralise,
} from "@/lib/format";
import {
  getCrmWorkspace,
  getDataQuality,
  recordHref,
} from "@/server/services/crm/crm.service";

export const metadata: Metadata = { title: "CRM workspace" };

export const dynamic = "force-dynamic";

export default async function CrmWorkspacePage() {
  const { actor, membership } = await requireWorkspace("/app/crm");

  const canReadLeads = can(membership, "PERM-LEAD.READ");
  const canReadContacts = can(membership, "PERM-CONTACT.READ");
  const canReadCompanies = can(membership, "PERM-COMPANY.READ");
  const canReadOpportunities = can(membership, "PERM-OPPORTUNITY.READ");
  const canReadTasks = can(membership, "PERM-TASK.READ");
  const canReadAutomation = can(membership, "PERM-AUTOMATION.READ");

  if (
    !canReadLeads &&
    !canReadContacts &&
    !canReadCompanies &&
    !canReadOpportunities
  ) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="CRM workspace"
          breadcrumbs={[
            { label: "Workspace", href: "/app" },
            { label: "CRM" },
          ]}
        />
        <CrmAccessDenied
          title="CRM access is not granted"
          description="Your workspace role does not include access to leads, contacts, accounts or opportunities. Ask a workspace administrator to review your permissions."
        />
      </div>
    );
  }

  const canReadQuality = canReadLeads && canReadContacts && canReadCompanies;

  const [workspace, quality] = await Promise.all([
    getCrmWorkspace({
      tenantId: membership.tenantId,
      userId: actor.id,
      features: {
        leads: canReadLeads,
        opportunities: canReadOpportunities,
        tasks: canReadTasks,
        companies: canReadCompanies,
        automation: canReadAutomation,
      },
    }),
    canReadQuality
      ? getDataQuality(membership.tenantId)
      : Promise.resolve(null),
  ]);

  // Timeline rows are filtered again here so a permitted record type never
  // reveals the subject of a record type the role cannot read.
  const recentTimeline = workspace.recentTimeline.filter((entry) => {
    if (entry.opportunityId) return canReadOpportunities;
    if (entry.leadId) return canReadLeads;
    if (entry.contactId) return canReadContacts;
    if (entry.companyId) return canReadCompanies;
    return false;
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="CRM workspace"
        description="A daily working view of this workspace's leads, deals, follow-ups and customer records, with transparent scoring baselines and a read-only copilot."
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "CRM" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canReadLeads ? (
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/app/leads" />}
              >
                Leads
              </Button>
            ) : null}
            {canReadOpportunities ? (
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/app/crm/pipeline" />}
              >
                Pipeline
                <ArrowRightIcon aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Leads"
          value={workspace.totals.leads}
          hint={
            canReadLeads
              ? `Average baseline score ${
                  workspace.totals.averageLeadScore ?? "not calculated"
                }`
              : "Lead access is not granted"
          }
          href={canReadLeads ? "/app/leads" : undefined}
        />
        <StatCard
          label="Open pipeline"
          value={formatCurrencyTotals(
            workspace.totals.openPipeline,
            "No open value",
          )}
          hint={`Weighted baseline: ${formatCurrencyTotals(
            workspace.totals.weightedPipeline,
            "not calculated",
          )}`}
          href={canReadOpportunities ? "/app/crm/pipeline" : undefined}
        />
        <StatCard
          label="Open tasks"
          value={workspace.totals.openTasks}
          hint={`${workspace.totals.dueTodayTasks} due today · ${workspace.totals.overdueTasks} overdue`}
          href={canReadTasks ? "/app/tasks" : undefined}
        />
        <StatCard
          label={
            canReadAutomation ? "Automation failures" : "Open opportunities"
          }
          value={
            canReadAutomation
              ? workspace.totals.automationFailures
              : workspace.totals.openOpportunities
          }
          hint={
            canReadAutomation
              ? "Failed runs in the last 7 days"
              : "Deals in open pipeline stages"
          }
          href={canReadAutomation ? "/app/crm/automations" : undefined}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <SectionCard
            title="Today's priorities"
            description="Ordered by urgency and business relevance. Each item states why it is shown and links to the source record."
            bodyClassName="p-0"
          >
            {workspace.priorities.length === 0 ? (
              <EmptyState
                icon={<SparklesIcon aria-hidden="true" />}
                title="Nothing urgent right now"
                description="No overdue follow-up, stale lead or stalled deal was detected from the records you can read."
              />
            ) : (
              <ul className="divide-y divide-border">
                {workspace.priorities.map((priority) => (
                  <li key={priority.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={priority.href}
                          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {priority.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {priority.detail}
                        </p>
                      </div>
                      <StatusBadge
                        status={priority.severity}
                        label={humanise(priority.severity)}
                        tone={
                          priority.severity === "high"
                            ? "danger"
                            : priority.severity === "medium"
                              ? "warning"
                              : "neutral"
                        }
                      />
                    </div>
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                      <CircleAlertIcon
                        className="mt-0.5 size-3 shrink-0"
                        aria-hidden="true"
                      />
                      {priority.reason}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            {canReadLeads ? (
              <SectionCard
                title="High-scoring leads"
                description="Open leads scoring 70 or more on the rule baseline."
                bodyClassName="p-0"
              >
                {workspace.hotLeads.length === 0 ? (
                  <EmptyState
                    icon={<FlameIcon aria-hidden="true" />}
                    title="No high-scoring leads"
                    description="No open lead currently reaches the baseline threshold."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {workspace.hotLeads.map((lead) => (
                      <li key={lead.id} className="px-4 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <RecordLink href={`/app/leads/${lead.id}`}>
                            {lead.firstName} {lead.lastName}
                          </RecordLink>
                          <StatusBadge
                            status={String(lead.score ?? 0)}
                            label={`${lead.score ?? 0} baseline`}
                            tone="primary"
                          />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {lead.companyName ?? "No company"} ·{" "}
                          {lead.owner?.name ??
                            lead.owner?.email ??
                            "Unassigned"}{" "}
                          · last contact{" "}
                          {lead.lastContactedAt
                            ? formatRelative(lead.lastContactedAt)
                            : "never"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            ) : null}

            {canReadLeads ? (
              <SectionCard
                title="Needs follow-up"
                description="Open leads without recorded contact for more than seven days."
                bodyClassName="p-0"
              >
                {workspace.staleLeads.length === 0 ? (
                  <EmptyState
                    icon={<UsersIcon aria-hidden="true" />}
                    title="No stale leads"
                    description="Every open lead has recent contact activity."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {workspace.staleLeads.map((lead) => (
                      <li key={lead.id} className="px-4 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <RecordLink href={`/app/leads/${lead.id}`}>
                            {lead.firstName} {lead.lastName}
                          </RecordLink>
                          <StatusBadge status={lead.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {lead.companyName ?? "No company"} · last contact{" "}
                          {lead.lastContactedAt
                            ? formatRelative(lead.lastContactedAt)
                            : `never (created ${formatRelative(lead.createdAt)})`}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            ) : null}

            {canReadOpportunities ? (
              <SectionCard
                title="At-risk opportunities"
                description="Stalled deals or deals whose expected close date has passed."
                bodyClassName="p-0"
              >
                {workspace.atRisk.length === 0 ? (
                  <EmptyState
                    icon={<ShieldAlertIcon aria-hidden="true" />}
                    title="No at-risk deals"
                    description="No open opportunity is stalled beyond 21 days or past its expected close date."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {workspace.atRisk.map((opportunity) => (
                      <li key={opportunity.id} className="px-4 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <RecordLink
                            href={`/app/opportunities/${opportunity.id}`}
                          >
                            {opportunity.name}
                          </RecordLink>
                          <StatusBadge status={opportunity.stage} />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {opportunity.company?.name ?? "No account"} ·{" "}
                          {formatCurrencyTotals(
                            [
                              {
                                currency: opportunity.currency,
                                value: Number(opportunity.amount ?? 0),
                              },
                            ],
                            "No value",
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {hasDatePassed(opportunity.expectedCloseDate)
                            ? `Expected close date passed ${formatDate(opportunity.expectedCloseDate)}.`
                            : `No stage movement since ${formatDate(opportunity.stageChangedAt)}.`}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            ) : null}

            {canReadOpportunities ? (
              <SectionCard
                title="Closing in the next 30 days"
                description="Open deals with a recorded expected close date."
                bodyClassName="p-0"
              >
                {workspace.closingSoon.length === 0 ? (
                  <EmptyState
                    icon={<TrendingUpIcon aria-hidden="true" />}
                    title="Nothing closing soon"
                    description="No open deal has an expected close date in the next 30 days."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {workspace.closingSoon.map((opportunity) => (
                      <li key={opportunity.id} className="px-4 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <RecordLink
                            href={`/app/opportunities/${opportunity.id}`}
                          >
                            {opportunity.name}
                          </RecordLink>
                          <span className="text-sm font-medium text-foreground tabular">
                            {formatCurrencyTotals(
                              [
                                {
                                  currency: opportunity.currency,
                                  value: Number(opportunity.amount ?? 0),
                                },
                              ],
                              "No value",
                            )}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {opportunity.company?.name ?? "No account"} · closes{" "}
                          {formatDate(opportunity.expectedCloseDate)} ·{" "}
                          {opportunity.winProbability ?? 0}% win baseline
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {canReadTasks ? (
              <SectionCard
                title="CRM tasks"
                description="Open follow-up work linked to CRM records."
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href="/app/tasks" />}
                  >
                    All tasks
                  </Button>
                }
                bodyClassName="p-0"
              >
                {workspace.upcomingTasks.length === 0 ? (
                  <EmptyState
                    icon={<SparklesIcon aria-hidden="true" />}
                    title="No open CRM tasks"
                    description="Follow-ups created for leads, contacts, accounts or opportunities appear here."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {workspace.upcomingTasks.map((task) => {
                      const overdue = hasDatePassed(task.dueDate);
                      return (
                        <li key={task.id} className="px-4 py-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {task.title}
                            </p>
                            <StatusBadge
                              status={task.priority}
                              label={humanise(task.priority)}
                              tone={
                                task.priority === "URGENT" ||
                                task.priority === "HIGH"
                                  ? "warning"
                                  : "neutral"
                              }
                            />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {task.assignee?.name ??
                              task.assignee?.email ??
                              "Unassigned"}
                            {task.dueDate ? (
                              <span
                                className={
                                  overdue ? "text-destructive" : undefined
                                }
                              >
                                {" "}
                                · due {formatDate(task.dueDate)}
                                {overdue ? " (overdue)" : ""}
                              </span>
                            ) : (
                              " · no due date"
                            )}
                            {task.relatedId ? (
                              <>
                                {" · "}
                                <Link
                                  href={recordHref(
                                    task.relatedType,
                                    task.relatedId,
                                  )}
                                  className="underline-offset-4 hover:underline"
                                >
                                  source record
                                </Link>
                              </>
                            ) : null}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </SectionCard>
            ) : null}

            <SectionCard
              title="Recent customer activity"
              description="Human, system and automation events recorded against CRM records."
              bodyClassName="p-0"
            >
              {recentTimeline.length === 0 ? (
                <EmptyState
                  icon={<WorkflowIcon aria-hidden="true" />}
                  title="No activity yet"
                  description="Calls, notes, meetings and record changes will appear here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {recentTimeline.map((entry) => {
                    const href =
                      entry.opportunityId
                        ? `/app/opportunities/${entry.opportunityId}`
                        : entry.leadId
                          ? `/app/leads/${entry.leadId}`
                          : entry.contactId
                            ? `/app/contacts/${entry.contactId}`
                            : entry.companyId
                              ? `/app/companies/${entry.companyId}`
                              : null;

                    return (
                      <li key={entry.id} className="px-4 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          {href ? (
                            <RecordLink href={href}>{entry.subject}</RecordLink>
                          ) : (
                            <p className="text-sm font-medium text-foreground">
                              {entry.subject}
                            </p>
                          )}
                          <time
                            dateTime={entry.occurredAt.toISOString()}
                            className="shrink-0 text-xs whitespace-nowrap text-muted-foreground"
                          >
                            {formatRelative(entry.occurredAt)}
                          </time>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {humanise(entry.type)} ·{" "}
                          {entry.user?.name ??
                            entry.user?.email ??
                            "Recorded by the system"}
                          {entry.source !== "HUMAN"
                            ? ` · ${entry.source.toLowerCase()}`
                            : ""}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <CrmCopilotPanel scope="workspace" />

          {quality ? (
            <div id="data-quality">
              <SectionCard
                title="Data quality"
                description={`Deterministic completeness score: ${quality.score}/100.`}
                action={
                  <Button
                    variant="ghost"
                    size="xs"
                    render={<Link href="#data-quality" />}
                  >
                    On this page
                  </Button>
                }
                bodyClassName="p-0"
              >
                {quality.issues.length === 0 ? (
                  <EmptyState
                    icon={<DatabaseIcon aria-hidden="true" />}
                    title="No issues detected"
                    description="Every stored lead, contact and account passed the current completeness checks."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {quality.issues.slice(0, 5).map((issue) => (
                      <li key={issue.key} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {issue.label}
                          </p>
                          <span className="text-sm font-semibold text-foreground tabular">
                            {formatNumber(issue.count)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {issue.description}
                        </p>
                        {issue.sample.length > 0 ? (
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                            {issue.sample.map((sample) => (
                              <Link
                                key={sample.id}
                                href={sample.href}
                                className="text-xs text-foreground underline-offset-4 hover:underline"
                              >
                                {sample.label}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          ) : null}

          <InlineAlert tone="info" title="How intelligence is calculated">
            <p>
              Lead scores and opportunity probabilities are transparent
              rule-based/statistical baselines computed from this workspace&apos;s
              own records. No trained machine-learning model is in use. Any
              forecast is pipeline-weighted, currencies are reported separately,
              and the copilot is read-only.
            </p>
            <p className="mt-2">
              {pluralise(workspace.totals.openOpportunities, "deal")} in open
              pipeline stages are represented in the current pipeline figures.
            </p>
          </InlineAlert>
        </aside>
      </div>
    </div>
  );
}
