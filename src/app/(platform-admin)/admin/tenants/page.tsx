import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Building2Icon, SearchIcon } from "lucide-react";
import { TenantStatus } from "@prisma/client";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState, SectionCard } from "@/components/app/states";
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
import { CreateTenantDialog } from "@/components/platform/create-tenant-dialog";
import { listTenants, tenantStatusValues } from "@/server/services/platform/tenants.service";
import { formatDate, humanise, pluralise } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tenants",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function isStatus(value: string | undefined): value is TenantStatus {
  return Boolean(value && tenantStatusValues.includes(value as TenantStatus));
}

export default async function AdminTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const validStatus = isStatus(status) ? status : undefined;

  const { tenants, total } = await listTenants({
    q: q?.trim() || undefined,
    status: validStatus,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tenants"
        description="Customer organisations provisioned on the platform, their lifecycle state and data volume."
        actions={<CreateTenantDialog />}
      />

      <TableSurface>
        <TableToolbar>
          <Suspense
            fallback={
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <SearchIcon className="size-4" aria-hidden="true" />
                Loading filters…
              </div>
            }
          >
            <SearchInput placeholder="Search tenants…" />
            <FilterSelect
              param="status"
              label="Filter by status"
              allLabel="All statuses"
              options={tenantStatusValues.map((value) => ({
                value,
                label: humanise(value),
              }))}
            />
            {q || validStatus ? <ClearFilters /> : null}
          </Suspense>
          <span className="ml-auto text-xs text-muted-foreground tabular">
            {total} {pluralise(total, "tenant")}
          </span>
        </TableToolbar>

        {tenants.length === 0 ? (
          <EmptyState
            icon={<Building2Icon aria-hidden="true" />}
            title={q || validStatus ? "No matching tenants" : "No tenants yet"}
            description={
              q || validStatus
                ? "Adjust the search term or status filter to see more results."
                : "Create the first tenant to onboard a customer organisation."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Industry</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Members
                </TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  Domains
                </TableHead>
                <TableHead className="hidden text-right lg:table-cell">
                  Invoices
                </TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <Link
                      href={`/admin/tenants/${tenant.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {tenant.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {tenant.slug}
                    </p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tenant.status} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {tenant.industry ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-right tabular sm:table-cell">
                    {tenant._count.memberships}
                  </TableCell>
                  <TableCell className="hidden text-right tabular md:table-cell">
                    {tenant._count.leads}
                  </TableCell>
                  <TableCell className="hidden text-right tabular lg:table-cell">
                    {tenant._count.invoices}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                    {formatDate(tenant.createdAt)}
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
          basePath="/admin/tenants"
          params={{ q, status: validStatus }}
          itemLabel="tenant"
        />
      </TableSurface>

      <SectionCard
        title="Lifecycle policy"
        description="Tenant state controls whether workspace routes and member sessions are allowed."
      >
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="font-medium text-foreground">Active</dt>
            <dd className="mt-0.5 text-muted-foreground">
              Full workspace access for active members.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Suspended</dt>
            <dd className="mt-0.5 text-muted-foreground">
              Access refused until a platform administrator reactivates the
              tenant.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Closing</dt>
            <dd className="mt-0.5 text-muted-foreground">
              Marked for decommissioning while data is retained.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Closed</dt>
            <dd className="mt-0.5 text-muted-foreground">
              Historical record only. Data remains available to the audit trail.
            </dd>
          </div>
        </dl>
      </SectionCard>
    </div>
  );
}
