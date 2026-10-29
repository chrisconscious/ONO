import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityIcon, Building2Icon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { StatCard } from "@/components/app/stat-card";
import { SectionCard } from "@/components/app/states";
import { TenantStatusActions } from "@/components/platform/tenant-status-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTenantDetail } from "@/server/services/platform/tenants.service";
import { formatDate, formatNumber, humanise, pluralise } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tenant detail",
};

export const dynamic = "force-dynamic";

export default async function AdminTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getTenantDetail(id);

  if (!detail) notFound();

  const { tenant, recentAudit } = detail;
  const counts = tenant._count;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tenant.name}
        description={`${tenant.slug}${tenant.industry ? ` · ${tenant.industry}` : ""} · created ${formatDate(tenant.createdAt)}`}
        breadcrumbs={[
          { label: "Tenants", href: "/admin/tenants" },
          { label: tenant.name },
        ]}
        actions={
          <TenantStatusActions
            tenantId={tenant.id}
            tenantName={tenant.name}
            currentStatus={tenant.status}
          />
        }
      />

      <div className="flex items-center gap-2">
        <StatusBadge status={tenant.status} />
        <span className="text-xs text-muted-foreground">
          {tenant.memberships.length}{" "}
          {pluralise(tenant.memberships.length, "membership")} ·{" "}
          {tenant.roles.length} {pluralise(tenant.roles.length, "role")}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Members" value={counts.memberships} />
        <StatCard label="Leads" value={counts.leads} />
        <StatCard label="Contacts" value={counts.contacts} />
        <StatCard label="Companies" value={counts.companies} />
        <StatCard label="Opportunities" value={counts.opportunities} />
        <StatCard label="Invoices" value={counts.invoices} />
        <StatCard label="Projects" value={counts.projects} />
        <StatCard label="Support cases" value={counts.supportCases} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <SectionCard
          title="Members"
          description="Accounts with a membership in this tenant. Membership roles control workspace permissions."
          bodyClassName="p-0"
        >
          {tenant.memberships.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No members have been added to this tenant yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Last sign-in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenant.memberships.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {membership.user.name ?? membership.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {membership.user.email}
                      </p>
                    </TableCell>
                    <TableCell>
                      {membership.roleAssignments.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          No role assigned
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {membership.roleAssignments.map((assignment) => (
                            <span
                              key={assignment.id}
                              className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[0.7rem] text-muted-foreground"
                            >
                              {assignment.role.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={membership.status} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                      {membership.user.lastLoginAt
                        ? formatDate(membership.user.lastLoginAt)
                        : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard
            title="Roles"
            description="Permission sets available inside this tenant."
            bodyClassName="p-0"
          >
            {tenant.roles.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No roles defined.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {tenant.roles.map((role) => (
                  <li key={role.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {role.name}
                      </p>
                      <span className="text-xs text-muted-foreground tabular">
                        {formatNumber(role._count.rolePermissions)} permissions
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {role.description ??
                        `${role._count.roleAssignments} ${pluralise(role._count.roleAssignments, "assignment")}`}
                      {role.isSystem ? " · System role" : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Data volume"
            description="Records held for this tenant across the core modules."
          >
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Quotations", counts.quotations],
                ["Sales orders", counts.salesOrders],
                ["Expenses", counts.expenses],
                ["Purchase orders", counts.purchaseOrders],
                ["Documents", counts.documents],
                ["Support cases", counts.supportCases],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 font-medium text-foreground tabular">
                    {formatNumber(Number(value))}
                  </dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Recent audit activity"
        description="The latest governance events recorded for this tenant."
        action={
          <Link
            href="/admin/audit"
            className="text-xs font-medium text-primary hover:underline"
          >
            Open audit log
          </Link>
        }
      >
        {recentAudit.length === 0 ? (
          <p className="px-1 py-6 text-sm text-muted-foreground">
            No audit entries recorded for this tenant yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recentAudit.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5">
                  <ActivityIcon
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm text-foreground">
                      {humanise(entry.action)} · {humanise(entry.resource)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.user?.name ?? entry.user?.email ?? "System"}
                    </p>
                  </div>
                </div>
                <time
                  dateTime={entry.createdAt.toISOString()}
                  className="text-xs text-muted-foreground"
                >
                  {formatDate(entry.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Building2Icon className="size-3.5" aria-hidden="true" />
        Tenant data is isolated. Platform administrators can see metadata only;
        opening tenant business records requires an explicit membership.
      </p>
    </div>
  );
}
