"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Wallet, Users, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiClientError } from "@/lib/api/client";
import { useWorkspaceBootstrap } from "@/components/shared/use-workspace";

interface SalesSummary {
  openCount: number;
  openValue: string;
  weightedPipelineValue: string;
  wonValue: string;
  winRate: number | null;
}
interface AgingSummary {
  current: string;
  overdue1to30: string;
  overdue31to60: string;
  overdueOver60: string;
}

/**
 * Tenant dashboard. KPI values come exclusively from the backend analytics
 * service (GET /api/v1/analytics/kpis), which derives them from persisted
 * records within the caller's tenant scope. If a metric cannot load we show
 * an explicit error state — never fabricated numbers.
 */
export default function DashboardPage() {
  const workspace = useWorkspaceBootstrap();
  const [sales, setSales] = useState<SalesSummary | null>(null);
  const [aging, setAging] = useState<AgingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspace.tenantId) return;
    let cancelled = false;
    setError(null);
    Promise.all([
      api.get<SalesSummary>("/api/v1/analytics/kpis", { metric: "sales-summary" }),
      api.get<AgingSummary>("/api/v1/analytics/kpis", { metric: "receivables-aging" }),
    ])
      .then(([s, a]) => {
        if (cancelled) return;
        setSales(s);
        setAging(a);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : "Failed to load metrics.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [workspace.tenantId]);

  const orgName = workspace.current?.tenant.name ?? "your organization";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Live operational metrics for {orgName}.
        </p>
      </div>

      {error && (
        <Card role="alert" className="border-destructive/40">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Users} title="Open opportunities" loading={!sales && !error}
          value={sales ? String(sales.openCount) : undefined} href="/crm/opportunities" />
        <MetricCard icon={TrendingUp} title="Open pipeline value" loading={!sales && !error}
          value={sales ? Number(sales.openValue).toLocaleString() : undefined} href="/crm/opportunities" />
        <MetricCard icon={Wallet} title="Won value" loading={!sales && !error}
          value={sales ? Number(sales.wonValue).toLocaleString() : undefined} href="/finance/invoices" />
        <MetricCard icon={Percent} title="Win rate" loading={!sales && !error}
          value={sales ? (sales.winRate === null ? "n/a" : `${sales.winRate}%`) : undefined}
          hint={sales ? `weighted pipeline ${Number(sales.weightedPipelineValue).toLocaleString()}` : undefined}
          href="/crm/opportunities" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receivables aging (outstanding)</CardTitle>
        </CardHeader>
        <CardContent>
          {!aging && !error ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : aging ? (
            <ul className="space-y-2 text-sm">
              {(
                [
                  ["Current", aging.current],
                  ["1–30 days overdue", aging.overdue1to30],
                  ["31–60 days overdue", aging.overdue31to60],
                  ["Over 60 days", aging.overdueOver60],
                ] as const
              ).map(([label, amount]) => (
                <li key={label} className="flex items-center justify-between border-b border-dashed pb-2 last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <Link href="/finance/invoices" className="font-medium tabular-nums hover:underline">
                    {Number(amount).toLocaleString()}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Metrics unavailable.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  hint,
  href,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value?: string;
  hint?: string;
  href: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <Link href={href} className="text-2xl font-semibold tabular-nums hover:underline">
            {value ?? "—"}
          </Link>
        )}
        {hint && !loading && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
