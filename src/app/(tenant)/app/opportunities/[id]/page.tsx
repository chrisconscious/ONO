import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  Building2Icon,
  FileTextIcon,
  HistoryIcon,
  TargetIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState, InlineAlert, SectionCard } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import {
  CrmAccessDenied,
  CrmTaskList,
  DetailRows,
  RecordLink,
  ScoreFactorList,
} from "@/components/workspace/crm-panels";
import { CrmCopilotPanel } from "@/components/workspace/crm-copilot";
import { OpportunityStageDialog } from "@/components/workspace/opportunity-stage-dialog";
import { RecordTimeline } from "@/components/workspace/record-timeline";
import { can, requireWorkspace } from "@/lib/auth/guards";
import { daysSinceDate, hasDatePassed, methodLabel, readScoreFactors } from "@/lib/crm/presentation";
import {
  formatCurrency,
  formatDate,
  formatRelative,
  humanise,
} from "@/lib/format";
import { getOpportunityDetail } from "@/server/services/crm/crm.service";

export const metadata: Metadata = { title: "Opportunity" };

export const dynamic = "force-dynamic";

const CLOSED_STAGES = new Set(["CLOSED_WON", "CLOSED_LOST"]);

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { actor, membership } = await requireWorkspace(
    `/app/opportunities/${id}`,
  );

  if (!can(membership, "PERM-OPPORTUNITY.READ")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Opportunity"
          breadcrumbs={[
            { label: "Workspace", href: "/app" },
            { label: "CRM", href: "/app/crm" },
            { label: "Opportunities", href: "/app/opportunities" },
            { label: "Record" },
          ]}
        />
        <CrmAccessDenied
          title="Opportunity access is not granted"
          description="Your workspace role does not include opportunity access. Ask a workspace administrator to review your permissions."
        />
      </div>
    );
  }

  const detail = await getOpportunityDetail(membership.tenantId, id);
  if (!detail) notFound();

  const { opportunity, timeline, tasks } = detail;
  const canUpdate = can(membership, "PERM-OPPORTUNITY.UPDATE");
  const canReadTasks = can(membership, "PERM-TASK.READ");
  const canReadQuotations = can(membership, "PERM-QUOTATION.READ");
  const canReadCompanies = can(membership, "PERM-COMPANY.READ");

  const isClosed = CLOSED_STAGES.has(opportunity.stage);
  const probability = opportunity.winProbability ?? opportunity.probability;
  const factors = readScoreFactors(opportunity.probabilityFactors);
  const amount = opportunity.amount == null ? null : Number(opportunity.amount);
  const weighted =
    amount != null ? (amount * probability) / 100 : null;

  const stageAgeDays = daysSinceDate(opportunity.stageChangedAt);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={opportunity.name}
        description={
          [opportunity.company?.name, opportunity.nextStep]
            .filter(Boolean)
            .join(" · ") || "Opportunity stored in this workspace."
        }
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "CRM", href: "/app/crm" },
          { label: "Opportunities", href: "/app/opportunities" },
          { label: opportunity.name },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/app/opportunities" />}
            >
              <ArrowLeftIcon aria-hidden="true" />
              All opportunities
            </Button>
            {canUpdate && !isClosed ? (
              <OpportunityStageDialog
                opportunityId={opportunity.id}
                currentStage={opportunity.stage}
                triggerSize="sm"
                triggerLabel="Change stage"
              />
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={opportunity.stage} />
        <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
          {stageAgeDays} {stageAgeDays === 1 ? "day" : "days"} in stage
        </span>
        {opportunity.currency ? (
          <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
            Currency: {opportunity.currency}
          </span>
        ) : null}
        {isClosed ? (
          <StatusBadge
            status={opportunity.stage}
            label={
              opportunity.stage === "CLOSED_WON"
                ? "Closed won — outcome recorded"
                : "Closed lost — outcome recorded"
            }
            tone={opportunity.stage === "CLOSED_WON" ? "success" : "danger"}
          />
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Deal value"
          value={formatCurrency(amount, opportunity.currency)}
          hint="Recorded amount, not predicted"
        />
        <StatCard
          label="Win baseline"
          value={`${probability}%`}
          hint={`${methodLabel(opportunity.probabilityMethod)} · weighted ${formatCurrency(
            weighted,
            opportunity.currency,
          )}`}
        />
        <StatCard
          label="Expected close"
          value={
            opportunity.expectedCloseDate
              ? formatDate(opportunity.expectedCloseDate)
              : "Not recorded"
          }
          hint={
            opportunity.closedAt
              ? `Closed ${formatDate(opportunity.closedAt)}`
              : hasDatePassed(opportunity.expectedCloseDate)
                ? "Expected close date has passed"
                : "Taken from the stored record"
          }
        />
        <StatCard
          label="Owner"
          value={
            opportunity.owner?.name ??
            opportunity.owner?.email ??
            "Unassigned"
          }
          hint={`Created ${formatDate(opportunity.createdAt)}`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <SectionCard
            title="Opportunity details"
            description="Facts stored on this record. Missing fields are left blank rather than inferred."
          >
            <DetailRows
              rows={[
                {
                  label: "Account",
                  value: opportunity.company ? (
                    canReadCompanies ? (
                      <RecordLink
                        href={`/app/companies/${opportunity.company.id}`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Building2Icon
                            className="size-3.5 text-muted-foreground"
                            aria-hidden="true"
                          />
                          {opportunity.company.name}
                        </span>
                      </RecordLink>
                    ) : (
                      opportunity.company.name
                    )
                  ) : (
                    "Not linked"
                  ),
                },
                {
                  label: "Stage",
                  value: <StatusBadge status={opportunity.stage} />,
                },
                {
                  label: "Amount",
                  value: formatCurrency(amount, opportunity.currency),
                },
                {
                  label: "Owner",
                  value:
                    opportunity.owner?.name ??
                    opportunity.owner?.email ??
                    "Unassigned",
                },
                {
                  label: "Expected close",
                  value: opportunity.expectedCloseDate
                    ? formatDate(opportunity.expectedCloseDate)
                    : "Not recorded",
                },
                {
                  label: "Last activity",
                  value: opportunity.lastActivityAt
                    ? formatRelative(opportunity.lastActivityAt)
                    : "Never",
                },
                {
                  label: "Stage changed",
                  value: formatDate(opportunity.stageChangedAt),
                },
                {
                  label: "Closed",
                  value: opportunity.closedAt
                    ? formatDate(opportunity.closedAt)
                    : "Not closed",
                },
                {
                  label: "Next step",
                  value: opportunity.nextStep?.trim() || "Not recorded",
                },
                {
                  label: "Won reason",
                  value: opportunity.wonReason?.trim() || "Not recorded",
                },
                {
                  label: "Lost reason",
                  value: opportunity.lostReason?.trim() || "Not recorded",
                },
                {
                  label: "Description",
                  value: (
                    <span className="whitespace-pre-wrap">
                      {opportunity.description?.trim() || "No description recorded"}
                    </span>
                  ),
                },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Why this win baseline"
            description="Every contribution stored by the latest probability calculation."
          >
            <ScoreFactorList factors={factors} />
            <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
              Method: {methodLabel(opportunity.probabilityMethod)}.{" "}
              {opportunity.probabilityUpdatedAt
                ? `Recalculated ${formatRelative(opportunity.probabilityUpdatedAt)}.`
                : "The probability has not been recalculated yet."}{" "}
              This is a transparent stage-and-activity baseline blended with this
              workspace&apos;s own closed outcomes where available. It is not a
              trained machine-learning model and is not a guarantee.
            </p>
          </SectionCard>

          <SectionCard
            title="Stage history"
            description="Immutable stage events recorded by people and automations."
            bodyClassName="p-0"
          >
            {opportunity.stageEvents.length === 0 ? (
              <EmptyState
                icon={<HistoryIcon aria-hidden="true" />}
                title="No stage changes yet"
                description="Stage changes recorded for this opportunity will appear here."
              />
            ) : (
              <ul className="divide-y divide-border">
                {opportunity.stageEvents.map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-wrap items-start justify-between gap-2 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        {humanise(event.fromStage)} → {humanise(event.toStage)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {event.actor?.name ??
                          event.actor?.email ??
                          "Recorded by the system"}{" "}
                        · {event.source.toLowerCase()}
                      </p>
                    </div>
                    <time
                      dateTime={event.createdAt.toISOString()}
                      className="shrink-0 text-xs whitespace-nowrap text-muted-foreground"
                    >
                      {formatDate(event.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {canReadQuotations ? (
            <SectionCard
              title="Quotations"
              description="Quotations linked to this opportunity. Amounts are stored values."
              bodyClassName="p-0"
            >
              {opportunity.quotations.length === 0 ? (
                <EmptyState
                  icon={<FileTextIcon aria-hidden="true" />}
                  title="No quotations linked"
                  description="Quotations created for this opportunity will appear here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {opportunity.quotations.map((quotation) => (
                    <li
                      key={quotation.id}
                      className="flex flex-wrap items-start justify-between gap-2 px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <RecordLink
                          href={`/app/quotations/${quotation.id}`}
                          className="text-sm"
                        >
                          {quotation.quoteNumber}
                        </RecordLink>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {humanise(quotation.status)}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-foreground tabular">
                        {formatCurrency(
                          Number(quotation.total),
                          quotation.currency,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          ) : null}

          <SectionCard
            title="Activity timeline"
            description="Human interactions plus system and automation events recorded against this opportunity."
          >
            <RecordTimeline
              referenceType="opportunity"
              referenceId={opportunity.id}
              initialItems={timeline}
              canWrite={canUpdate}
              currentUserName={actor.name ?? actor.email}
            />
          </SectionCard>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <CrmCopilotPanel
            scope="opportunity"
            recordId={opportunity.id}
            contextLabel={`opportunity ${opportunity.name}`}
          />

          {canReadTasks ? (
            <SectionCard
              title="Linked tasks"
              description="Follow-up work attached to this opportunity."
              bodyClassName="p-0 px-4 py-3"
            >
              <CrmTaskList
                tasks={tasks}
                emptyDescription="No task is currently linked to this opportunity."
              />
            </SectionCard>
          ) : null}

          <InlineAlert tone="info" title="Confirmation required">
            <p className="flex items-start gap-1.5">
              <TargetIcon
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              Stage changes are validated and audited on the server. Closing a
              deal as lost requires a reason, closed deals cannot be reopened
              here, and the copilot never changes a stage on your behalf.
            </p>
          </InlineAlert>

          {!canUpdate ? (
            <InlineAlert tone="warning" title="Read-only opportunity">
              Your workspace role can read this opportunity but not update it.
              Ask a workspace administrator if you need to change its stage.
            </InlineAlert>
          ) : null}

          {isClosed ? (
            <InlineAlert tone="warning" title="Closed deal">
              This opportunity is closed and kept as sales history. Create a new
              opportunity instead of reopening it.
            </InlineAlert>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
