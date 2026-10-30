import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangleIcon,
  BarChart3Icon,
  DatabaseIcon,
  TrendingUpIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState, InlineAlert, SectionCard } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import {
  CrmAccessDenied,
  CurrencyAmounts,
  RecordLink,
} from "@/components/workspace/crm-panels";
import { can, requireWorkspace } from "@/lib/auth/guards";
import { forecastAssumptions } from "@/lib/crm/scoring";
import {
  formatCurrencyTotals,
  transitionLabel,
} from "@/lib/crm/presentation";
import {
  formatCurrency,
  formatNumber,
  humanise,
  pluralise,
} from "@/lib/format";
import {
  getCrmAnalytics,
  getDataQuality,
} from "@/server/services/crm/crm.service";

export const metadata: Metadata = { title: "Sales insights" };

export const dynamic = "force-dynamic";

export default async function CrmInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>;
}) {
  const { membership } = await requireWorkspace("/app/crm/insights");

  if (!can(membership, "PERM-ANALYTICS.READ")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Sales insights"
          breadcrumbs={[
            { label: "Workspace", href: "/app" },
            { label: "CRM", href: "/app/crm" },
            { label: "Insights" },
          ]}
        />
        <CrmAccessDenied
          title="Sales insights access is not granted"
          description="Your workspace role does not include analytics access. Ask a workspace administrator to review your permissions."
        />
      </div>
    );
  }

  const { months } = await searchParams;
  const period = Number(months) === 12 ? 12 : 6;

  const canReadQuality =
    can(membership, "PERM-LEAD.READ") &&
    can(membership, "PERM-CONTACT.READ") &&
    can(membership, "PERM-COMPANY.READ");

  const [analytics, quality] = await Promise.all([
    getCrmAnalytics(membership.tenantId, period),
    canReadQuality
      ? getDataQuality(membership.tenantId)
      : Promise.resolve(null),
  ]);

  const leadMax = Math.max(
    1,
    ...analytics.buckets.map((bucket) =>
      Math.max(bucket.leads, bucket.converted),
    ),
  );
  const outcomeMax = Math.max(
    1,
    ...analytics.buckets.map((bucket) => Math.max(bucket.won, bucket.lost)),
  );
  const funnelMax = Math.max(1, ...analytics.stageFunnel.map((row) => row.count));

  const wonRows = analytics.totals.wonValueByCurrency;
  const singleWonCurrency = wonRows.length === 1 ? wonRows[0].currency : null;
  const lostTotal = analytics.totals.lostCount;
  const lostReasons = [...analytics.lostReasons].sort(
    (a, b) => b.count - a.count,
  );
  const transitions = Object.entries(analytics.stageTransitions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sales insights"
        description="Conversion, pipeline, activity and forecast figures calculated from the records stored in this workspace. Currencies are reported separately."
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "CRM", href: "/app/crm" },
          { label: "Insights" },
        ]}
        actions={
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={period === 6 ? "default" : "outline"}
              nativeButton={false} render={<Link href="/app/crm/insights" />}
            >
              6 months
            </Button>
            <Button
              size="sm"
              variant={period === 12 ? "default" : "outline"}
              nativeButton={false} render={<Link href="/app/crm/insights?months=12" />}
            >
              12 months
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Win rate"
          value={
            analytics.totals.winRate != null
              ? `${Math.round(analytics.totals.winRate)}%`
              : "—"
          }
          hint={`${analytics.totals.wonCount} won · ${analytics.totals.lostCount} lost, all closed deals`}
        />
        <StatCard
          label="Closed-won value"
          value={formatCurrencyTotals(wonRows, "No won value")}
          hint={`${pluralise(analytics.totals.wonCount, "deal")} closed won`}
        />
        <StatCard
          label="Average deal size"
          value={
            analytics.totals.averageDealSize != null && singleWonCurrency
              ? formatCurrency(
                  analytics.totals.averageDealSize,
                  singleWonCurrency,
                )
              : "—"
          }
          hint={
            singleWonCurrency
              ? "Closed-won deals, single currency"
              : "Only shown when closed-won deals share one currency"
          }
        />
        <StatCard
          label="Average sales cycle"
          value={
            analytics.totals.averageCycleDays != null
              ? `${analytics.totals.averageCycleDays}d`
              : "—"
          }
          hint="Created to closed-won, all won deals"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open pipeline"
          value={formatCurrencyTotals(
            analytics.totals.openPipelineByCurrency,
            "No open value",
          )}
          hint="Unweighted open opportunity amount"
        />
        <StatCard
          label="Weighted pipeline"
          value={formatCurrencyTotals(
            analytics.totals.weightedPipelineByCurrency,
            "Not calculated",
          )}
          hint="Open amount × win baseline"
        />
        <StatCard
          label={`Leads (${period} months)`}
          value={analytics.totals.leadsInPeriod}
          hint={`${analytics.totals.convertedInPeriod} converted in the same period`}
        />
        <StatCard
          label="Follow-up completion"
          value={
            analytics.totals.followUpCompletionRate != null
              ? `${Math.round(analytics.totals.followUpCompletionRate)}%`
              : "—"
          }
          hint={`${analytics.totals.tasksCompleted} of ${analytics.totals.tasksCreated} CRM tasks created in period · ${analytics.totals.overdueTasks} overdue`}
        />
      </div>

      <InlineAlert tone="info" title="Metric definitions">
        <p>
          Win rate is closed-won ÷ (closed-won + closed-lost) across all closed
          deals in this workspace, not just the selected period. Lead and task
          counts cover the selected period. Average deal size is hidden when won
          deals use more than one currency because currencies are never added
          together. No figure on this page is generated or estimated.
        </p>
      </InlineAlert>

      <SectionCard
        title="Lead flow and outcomes"
        description={`Recorded lead creation, conversion, won and lost counts by month over the last ${period} months.`}
      >
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" aria-hidden="true" />
            Leads created
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-info" aria-hidden="true" />
            Leads converted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-success" aria-hidden="true" />
            Deals won
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-destructive" aria-hidden="true" />
            Deals lost
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 items-end gap-3 sm:grid-cols-6 xl:grid-cols-12">
          {analytics.buckets.map((bucket) => (
            <div key={bucket.key} className="flex flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end justify-center gap-1">
                <span
                  className="w-1/5 rounded-t-sm bg-primary"
                  style={{
                    height: `${Math.max(2, (bucket.leads / leadMax) * 100)}%`,
                  }}
                  title={`${bucket.label}: ${bucket.leads} leads created`}
                />
                <span
                  className="w-1/5 rounded-t-sm bg-info"
                  style={{
                    height: `${Math.max(2, (bucket.converted / leadMax) * 100)}%`,
                  }}
                  title={`${bucket.label}: ${bucket.converted} leads converted`}
                />
                <span
                  className="w-1/5 rounded-t-sm bg-success"
                  style={{
                    height: `${Math.max(2, (bucket.won / outcomeMax) * 100)}%`,
                  }}
                  title={`${bucket.label}: ${bucket.won} deals won`}
                />
                <span
                  className="w-1/5 rounded-t-sm bg-destructive"
                  style={{
                    height: `${Math.max(2, (bucket.lost / outcomeMax) * 100)}%`,
                  }}
                  title={`${bucket.label}: ${bucket.lost} deals lost`}
                />
              </div>
              <span className="text-[0.7rem] text-muted-foreground">
                {bucket.label}
              </span>
              <span className="text-[0.65rem] text-muted-foreground">
                {bucket.activities} {pluralise(bucket.activities, "activity", "activities")}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          Lead bars use one scale; won and lost bars use a separate scale. Hover
          or focus a bar to read its exact value.
        </p>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Lead source performance"
          description="All leads in this workspace, grouped by recorded source."
          bodyClassName="p-0"
        >
          {analytics.sourcePerformance.length === 0 ? (
            <EmptyState
              icon={<BarChart3Icon aria-hidden="true" />}
              title="No lead sources yet"
              description="Lead source performance appears once leads are recorded."
            />
          ) : (
            <ul className="divide-y divide-border">
              {analytics.sourcePerformance.map((source) => (
                <li key={source.source} className="px-4 py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {humanise(source.source)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular">
                      {source.converted} converted / {source.total} leads
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.min(100, Math.max(0, source.conversionRate))}%`,
                        }}
                      />
                    </span>
                    <span className="w-12 text-right text-xs font-medium text-foreground tabular">
                      {Math.round(source.conversionRate)}%
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                    {source.lost} lost or unqualified
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Open pipeline by stage"
          description="Deal counts in each open stage. Values are not summed across currencies."
          bodyClassName="p-0"
        >
          {analytics.stageFunnel.every((row) => row.count === 0) ? (
            <EmptyState
              icon={<TrendingUpIcon aria-hidden="true" />}
              title="No open deals"
              description="Open opportunities are required to show a stage funnel."
            />
          ) : (
            <ul className="divide-y divide-border">
              {analytics.stageFunnel.map((row) => (
                <li key={row.stage} className="px-4 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {humanise(row.stage)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular">
                      {row.count} {pluralise(row.count, "deal")}
                    </p>
                  </div>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.max(2, (row.count / funnelMax) * 100)}%`,
                      }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Lost reasons"
          description="Reasons recorded when a deal was closed lost."
          bodyClassName="p-0"
        >
          {lostReasons.length === 0 ? (
            <EmptyState
              icon={<AlertTriangleIcon aria-hidden="true" />}
              title="No lost reasons recorded"
              description="Closing a deal as lost requires a reason, which will be summarised here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {lostReasons.map((row) => (
                <li
                  key={row.reason}
                  className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5"
                >
                  <p className="text-sm text-foreground">{row.reason}</p>
                  <p className="text-xs text-muted-foreground tabular">
                    {row.count} {pluralise(row.count, "deal")}
                    {lostTotal > 0
                      ? ` · ${Math.round((row.count / lostTotal) * 100)}%`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Recorded stage transitions"
          description="Immutable stage events recorded in the selected period."
          bodyClassName="p-0"
        >
          {transitions.length === 0 ? (
            <EmptyState
              icon={<BarChart3Icon aria-hidden="true" />}
              title="No stage transitions"
              description="Stage changes recorded in this period will appear here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {transitions.map(([key, count]) => (
                <li
                  key={key}
                  className="flex items-baseline justify-between gap-2 px-4 py-2.5"
                >
                  <p className="text-sm text-foreground">
                    {transitionLabel(key)}
                  </p>
                  <p className="text-xs text-muted-foreground tabular">
                    {count} {pluralise(count, "transition")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Pipeline-weighted forecast"
        description="Expected revenue by month, reported per currency. This is a transparent baseline, not a trained forecasting model."
      >
        {analytics.forecasts.length === 0 ? (
          <EmptyState
            icon={<TrendingUpIcon aria-hidden="true" />}
            title="No forecast available"
            description="Open opportunities with an expected close date are required to build a forecast."
          />
        ) : (
          <div className="flex flex-col gap-6">
            {analytics.forecasts.map((forecast) => (
              <section
                key={forecast.currency}
                aria-labelledby={`forecast-${forecast.currency}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3
                    id={`forecast-${forecast.currency}`}
                    className="text-sm font-semibold text-foreground"
                  >
                    {forecast.currency}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {forecast.totals.openCount} open ·{" "}
                    {forecast.totals.committedCount} closed won
                  </p>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <ForecastTotal
                    label="Weighted"
                    value={formatCurrency(
                      forecast.totals.weighted,
                      forecast.currency,
                    )}
                  />
                  <ForecastTotal
                    label="Best case"
                    value={formatCurrency(
                      forecast.totals.bestCase,
                      forecast.currency,
                    )}
                  />
                  <ForecastTotal
                    label="Conservative"
                    value={formatCurrency(
                      forecast.totals.conservative,
                      forecast.currency,
                    )}
                  />
                  <ForecastTotal
                    label="Committed (won)"
                    value={formatCurrency(
                      forecast.totals.committed,
                      forecast.currency,
                    )}
                  />
                </div>

                <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
                  {forecast.buckets.map((bucket) => (
                    <li
                      key={bucket.key}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {bucket.label}
                      </p>
                      <p className="text-xs text-muted-foreground tabular">
                        {bucket.openCount} open · weighted{" "}
                        {formatCurrency(bucket.weighted, forecast.currency)} ·
                        best {formatCurrency(bucket.bestCase, forecast.currency)}{" "}
                        · conservative{" "}
                        {formatCurrency(bucket.conservative, forecast.currency)}
                        {bucket.committedCount > 0
                          ? ` · committed ${formatCurrency(bucket.committed, forecast.currency)}`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <ul className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              {forecastAssumptions().map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Open pipeline by currency"
          description="Recorded and weighted values for open opportunities."
        >
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
                Recorded amount
              </p>
              <CurrencyAmounts
                rows={analytics.totals.openPipelineByCurrency}
                emptyLabel="No open opportunity value"
                className="mt-1"
              />
            </div>
            <div>
              <p className="text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
                Weighted baseline
              </p>
              <CurrencyAmounts
                rows={analytics.totals.weightedPipelineByCurrency}
                emptyLabel="Not calculated"
                className="mt-1"
              />
            </div>
            <div>
              <p className="text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
                Closed-won value
              </p>
              <CurrencyAmounts
                rows={wonRows}
                emptyLabel="No closed-won value"
                className="mt-1"
              />
            </div>
          </div>
        </SectionCard>

        {quality ? (
          <div id="data-quality">
            <SectionCard
              title="Data quality"
              description={`Deterministic completeness score: ${quality.score}/100.`}
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
                  {quality.issues.map((issue) => (
                    <li key={issue.key} className="px-4 py-2.5">
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
                            <RecordLink
                              key={sample.id}
                              href={sample.href}
                              className="text-xs"
                            >
                              {sample.label}
                            </RecordLink>
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
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Figures cover {membership.tenant.name} only. All metrics are calculated
        from the stored workspace records described above and do not expose
        individual records beyond your permissions.
      </p>
    </div>
  );
}

function ForecastTotal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-foreground tabular">
        {value}
      </p>
    </div>
  );
}
