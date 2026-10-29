import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlertIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { StockLevelsTable } from "@/components/workspace/stock-levels-table";
import { can, requireWorkspace } from "@/lib/auth/guards";
import { getStockLevels } from "@/server/services/tenant/records.service";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Stock levels" };

export const dynamic = "force-dynamic";

export default async function StockLevelsPage() {
  const { membership } = await requireWorkspace("/app/stock-levels");

  if (!can(membership, "PERM-STOCK.READ")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Stock levels" />
        <div className="rounded-xl border border-border bg-card shadow-xs">
          <EmptyState
            icon={<ShieldAlertIcon aria-hidden="true" />}
            title="Inventory access is not granted"
            description="Your workspace role does not include stock access. Ask a workspace administrator to review your role permissions."
          />
        </div>
      </div>
    );
  }

  const rows = await getStockLevels(membership.tenantId);
  const warehouses = new Set(rows.map((row) => row.warehouseId)).size;
  const totalUnits = rows.reduce((sum, row) => sum + row.quantity, 0);
  const outOfStock = rows.filter((row) => row.quantity <= 0).length;
  const canAdjust = can(membership, "PERM-STOCK.ADJUST");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stock levels"
        description="Current quantities derived from immutable stock movements across every warehouse."
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "Inventory" },
          { label: "Stock levels" },
        ]}
        actions={
          canAdjust ? (
            <Button render={<Link href="/app/stock-movements" />}>
              Record movement
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Stock lines" value={rows.length} hint="Product and warehouse pairs" />
        <StatCard label="Warehouses" value={warehouses} hint="Locations with movements" />
        <StatCard label="Units on hand" value={formatNumber(totalUnits)} hint="Sum of derived quantities" />
        <StatCard
          label="Out of stock"
          value={outOfStock}
          hint="Lines at or below zero"
        />
      </div>

      <StockLevelsTable rows={rows} />

      <p className="text-xs leading-relaxed text-muted-foreground">
        Quantities are calculated from receipts, issues and signed adjustments. They
        are never edited directly, so every change has an actor, a reason and a
        timestamp in the audit trail.
      </p>
    </div>
  );
}
