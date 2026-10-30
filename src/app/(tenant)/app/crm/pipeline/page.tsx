import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CircleDollarSignIcon,
  ClockIcon,
  TargetIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState, InlineAlert } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import {
  CrmAccessDenied,
  CurrencyAmounts,
  RecordLink,
} from "@/components/workspace/crm-panels";
import { OpportunityStageDialog } from "@/components/workspace/opportunity-stage-dialog";
import { can, requireWorkspace } from "@/lib/auth/guards";
import {
  daysSinceDate,
  formatCurrencyTotals,
  hasDatePassed,
  methodLabel,
} from "@/lib/crm/presentation";
import {
  formatDate,
  formatNumber,
  humanise,
  pluralise,
} from "@/lib/format";
import { getPipelineBoard } from "@/server/services/crm/crm.service";

export const metadata: Metadata = { title: "Sales pipeline" };

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const { membership } = await requireWorkspace("/app/crm/pipeline");

  if (!can(membership, "PERM-OPPORTUNITY.READ")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Sales pipeline"
          breadcrumbs={[
            { label: "Workspace", href: "/app" },
            { label: "CRM", href: "/app/crm" },
            { label: "Pipeline" },
          ]}
        />
        <CrmAccessDenied
          title="Pipeline access is not granted"
          description="Your workspace role does not include opportunity access. Ask a workspace administrator to review your permissions."
        />
      </div>
    );
  }

  const canUpdate = can(membership, "PERM-OPPORTUNITY.UPDATE");
  const board = await getPipelineBoard(membership.tenantId);

  const totals = new Map<string, { open: number; weighted: number }>();
  for (const card of board.cards) {
    const current = totals.get(card.currency) ?? { open: 0, weighted: 0 };
    current.open += card.amount ?? 0;
    current.weighted += ((card.amount ?? 0) * (card.winProbability ?? 0)) / 100;
    totals.set(card.currency, current);
  }

  const openRows = [...totals.entries()].map(([currency, value]) => ({
    currency,
    value: value.open,
  }));
  const weightedRows = [...totals.entries()].map(([currency, value]) => ({
    currency,
    value: value.weighted,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sales pipeline"
        description="Every open opportunity by recorded stage. Values, win baselines and closure dates come from the stored records; currencies are never combined."
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "CRM", href: "/app/crm" },
          { label: "Pipeline" },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/app/opportunities" />}
          >
            All opportunities
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open deals"
          value={board.cards.length}
          hint={`${pluralise(board.cards.filter((card) => card.overdueTasks > 0).length, "deal")} with overdue tasks`}
        />
        <StatCard
          label="Open pipeline"
          value={formatCurrencyTotals(openRows, "No open value")}
          hint="Unweighted recorded amount"
        />
        <StatCard
          label="Weighted pipeline"
          value={formatCurrencyTotals(weightedRows, "Not calculated")}
          hint="Amount × current win baseline"
        />
        <StatCard
          label="Expected this month"
          value={formatCurrencyTotals(
            board.cards
              .filter((card) => {
                if (!card.expectedCloseDate) return false;
                const now = new Date();
                return (
                  card.expectedCloseDate.getUTCFullYear() ===
                    now.getUTCFullYear() &&
                  card.expectedCloseDate.getUTCMonth() === now.getUTCMonth()
                );
              })
              .reduce<Array<{ currency: string; value: number }>>(
                (rows, card) => {
                  const row = rows.find(
                    (entry) => entry.currency === card.currency,
                  );
                  if (row) {
                    row.value += card.amount ?? 0;
                  } else {
                    rows.push({
                      currency: card.currency,
                      value: card.amount ?? 0,
                    });
                  }
                  return rows;
                },
                [],
              ),
            "Nothing recorded",
          )}
          hint="Deals with a close date in the current month"
        />
      </div>

      <InlineAlert tone="info" title="How the pipeline figures work">
        <p>
          Total value is the sum of recorded opportunity amounts per currency.
          Weighted value multiplies each open deal by its stored win baseline.
          The baseline is a transparent rule-based/statistical calculation, not a
          trained machine-learning model. Stage changes are validated and
          recorded on the server.
        </p>
      </InlineAlert>

      {board.cards.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-xs">
          <EmptyState
            icon={<TargetIcon aria-hidden="true" />}
            title="No open opportunities"
            description="Create an opportunity or convert a qualified lead to start building the pipeline."
            action={
              <Button render={<Link href="/app/opportunities" />}>
                Open opportunities
                <ArrowRightIcon aria-hidden="true" />
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          {board.stages.map((stage) => (
            <section
              key={stage.stage}
              aria-labelledby={`stage-${stage.stage}`}
              className="flex min-w-0 flex-col rounded-xl border border-border bg-card shadow-xs"
            >
              <header className="border-b border-border px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2
                      id={`stage-${stage.stage}`}
                      className="text-sm font-semibold text-foreground"
                    >
                      {humanise(stage.stage)}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatNumber(stage.count)}{" "}
                      {pluralise(stage.count, "deal")}
                    </p>
                  </div>
                  <StatusBadge status={stage.stage} showDot={false} />
                </div>
                <div className="mt-2 space-y-1">
                  <CurrencyAmounts
                    rows={stage.totals}
                    emptyLabel="No recorded value"
                  />
                  {stage.weighted.length > 0 ? (
                    <p className="text-[0.7rem] text-muted-foreground">
                      Weighted{" "}
                      {formatCurrencyTotals(stage.weighted, "not calculated")}
                    </p>
                  ) : null}
                </div>
              </header>

              <ul className="flex flex-col gap-2 p-2.5">
                {stage.cards.length === 0 ? (
                  <li className="px-2 py-6 text-center text-xs text-muted-foreground">
                    No deals in this stage.
                  </li>
                ) : (
                  stage.cards.map((card) => {
                    const stageDays = daysSinceDate(card.stageChangedAt);

                    return (
                      <li
                        key={card.id}
                        className="rounded-lg border border-border bg-background p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <RecordLink
                            href={`/app/opportunities/${card.id}`}
                            className="text-sm"
                          >
                            {card.name}
                          </RecordLink>
                          <span className="shrink-0 text-sm font-semibold text-foreground tabular">
                            {card.amount != null
                              ? formatCurrencyTotals(
                                  [
                                    {
                                      currency: card.currency,
                                      value: card.amount,
                                    },
                                  ],
                                  "No value",
                                )
                              : "No value"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {card.company?.name ?? "No account"} ·{" "}
                          {card.owner?.name ??
                            card.owner?.email ??
                            "Unassigned"}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[0.65rem] text-muted-foreground">
                            {card.winProbability != null
                              ? `${card.winProbability}% ${methodLabel(card.probabilityMethod).toLowerCase()}`
                              : "Win baseline not calculated"}
                          </span>
                          {card.overdueTasks > 0 ? (
                            <span className="rounded-full border border-destructive/25 bg-destructive/10 px-2 py-0.5 text-[0.65rem] font-medium text-destructive">
                              {card.overdueTasks} overdue{" "}
                              {pluralise(card.overdueTasks, "task")}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                          <p className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                            <ClockIcon className="size-3" aria-hidden="true" />
                            {card.expectedCloseDate
                              ? `Closes ${formatDate(card.expectedCloseDate)}`
                              : "No close date"}
                            {" · "}
                            {stageDays}d in stage
                          </p>
                          <OpportunityStageDialog
                            opportunityId={card.id}
                            currentStage={card.stage}
                            disabled={!canUpdate}
                            triggerLabel="Move"
                          />
                        </div>

                        {hasDatePassed(card.expectedCloseDate) ? (
                          <p className="mt-1.5 flex items-center gap-1 text-[0.7rem] text-destructive">
                            <CircleDollarSignIcon
                              className="size-3"
                              aria-hidden="true"
                            />
                            Expected close date has passed.
                          </p>
                        ) : null}
                      </li>
                    );
                  })
                )}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
