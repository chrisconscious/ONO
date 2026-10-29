import type { Metadata } from "next";
import { Suspense } from "react";
import { ActivityIcon, ScrollTextIcon } from "lucide-react";
import { AuditAction } from "@prisma/client";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  TableSurface,
  TableToolbar,
} from "@/components/app/data-table";
import { ClearFilters, FilterSelect, SearchInput } from "@/components/app/filters";
import {
  getAuditActionCounts,
  listAuditLogs,
} from "@/server/services/platform/audit.service";
import { formatDateTime, humanise, pluralise } from "@/lib/format";

export const metadata: Metadata = {
  title: "Audit log",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

function parseAction(value: string | undefined): AuditAction | undefined {
  return value && Object.values(AuditAction).includes(value as AuditAction)
    ? (value as AuditAction)
    : undefined;
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; page?: string }>;
}) {
  const { q, action, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const activeAction = parseAction(action);

  const [{ logs, total }, counts] = await Promise.all([
    listAuditLogs({
      q: q?.trim() || undefined,
      action: activeAction,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    getAuditActionCounts(),
  ]);

  const logins = counts.LOGIN ?? 0;
  const writes =
    (counts.CREATE ?? 0) +
    (counts.UPDATE ?? 0) +
    (counts.DELETE ?? 0);
  const governance =
    (counts.APPROVE ?? 0) +
    (counts.REJECT ?? 0) +
    (counts.SUSPEND ?? 0) +
    (counts.ACTIVATE ?? 0) +
    (counts.ASSIGN_ROLE ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit log"
        description="Immutable record of authentication, data changes and governance decisions across the platform."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total events" value={Object.values(counts).reduce((sum, value) => sum + value, 0)} />
        <StatCard label="Sign-ins" value={logins} hint="Successful authentications" />
        <StatCard label="Data changes" value={writes} hint="Creates, updates and deletes" />
        <StatCard label="Governance" value={governance} hint="Approvals, suspensions and role changes" />
      </div>

      <TableSurface>
        <TableToolbar>
          <Suspense
            fallback={
              <span className="text-xs text-muted-foreground">
                Loading filters…
              </span>
            }
          >
            <SearchInput placeholder="Search resource, actor or tenant…" />
            <FilterSelect
              param="action"
              label="Filter by action"
              allLabel="All actions"
              options={Object.values(AuditAction).map((value) => ({
                value,
                label: humanise(value),
              }))}
            />
            {q || activeAction ? <ClearFilters /> : null}
          </Suspense>
          <span className="ml-auto text-xs text-muted-foreground tabular">
            {total} {pluralise(total, "event")}
          </span>
        </TableToolbar>

        {logs.length === 0 ? (
          <EmptyState
            icon={<ScrollTextIcon aria-hidden="true" />}
            title="No audit events"
            description="Actions performed by administrators and workspace members will appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead className="hidden md:table-cell">Actor</TableHead>
                <TableHead className="hidden lg:table-cell">Tenant</TableHead>
                <TableHead className="hidden xl:table-cell">IP address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground tabular">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={log.action}
                      tone={
                        log.action === "DELETE" ||
                        log.action === "SUSPEND" ||
                        log.action === "REJECT"
                          ? "danger"
                          : log.action === "CREATE" ||
                              log.action === "APPROVE" ||
                              log.action === "ACTIVATE"
                            ? "success"
                            : log.action === "LOGIN" || log.action === "LOGOUT"
                              ? "info"
                              : "neutral"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <p className="text-foreground">{humanise(log.resource)}</p>
                    {log.resourceId ? (
                      <p className="max-w-40 truncate font-mono text-[0.65rem] text-muted-foreground">
                        {log.resourceId}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-foreground">
                      {log.user?.name ?? "System"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.user?.email ?? "No account"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {log.tenant?.name ?? "Platform"}
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground xl:table-cell">
                    {log.ipAddress ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Pagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={total}
          basePath="/admin/audit"
          params={{ q, action: activeAction }}
          itemLabel="event"
        />
      </TableSurface>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <ActivityIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Audit entries are append-only. Nothing on this screen can edit or delete
        a recorded event.
      </p>
    </div>
  );
}
