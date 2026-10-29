import type { Metadata } from "next";
import { Suspense } from "react";
import { UserCogIcon } from "lucide-react";
import { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { AdminRoleControl } from "@/components/platform/admin-role-control";
import { CreateAdminDialog } from "@/components/platform/create-admin-dialog";
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
  getUserRoleCounts,
  listPlatformUsers,
} from "@/server/services/platform/users.service";
import { getCurrentActor } from "@/lib/auth/guards";
import { formatDate, humanise, pluralise } from "@/lib/format";

export const metadata: Metadata = {
  title: "Administrators",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

function parseRole(value: string | undefined): UserRole | undefined {
  return value && Object.values(UserRole).includes(value as UserRole)
    ? (value as UserRole)
    : undefined;
}

export default async function AdminAdministratorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const { q, role, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const validRole = parseRole(role);

  const [{ users, total }, counts, actor] = await Promise.all([
    listPlatformUsers({
      q: q?.trim() || undefined,
      role: validRole,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    getUserRoleCounts(),
    getCurrentActor(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Administrators and accounts"
        description="Every account on the platform and the role that determines its access. Platform privilege is verified on the server for each request."
        actions={<CreateAdminDialog />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total accounts"
          value={Object.values(counts).reduce((sum, value) => sum + value, 0)}
        />
        <StatCard
          label="Platform administrators"
          value={counts.PLATFORM_ADMIN ?? 0}
          hint="Full platform console access"
        />
        <StatCard
          label="Tenant administrators"
          value={counts.TENANT_ADMIN ?? 0}
          hint="Workspace administration only"
        />
        <StatCard
          label="Members"
          value={counts.MEMBER ?? 0}
          hint="Workspace access through membership roles"
        />
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
            <SearchInput placeholder="Search accounts…" />
            <FilterSelect
              param="role"
              label="Filter by role"
              allLabel="All roles"
              options={Object.values(UserRole).map((value) => ({
                value,
                label: humanise(value),
              }))}
            />
            {q || validRole ? <ClearFilters /> : null}
          </Suspense>
          <span className="ml-auto text-xs text-muted-foreground tabular">
            {total} {pluralise(total, "account")}
          </span>
        </TableToolbar>

        {users.length === 0 ? (
          <EmptyState
            icon={<UserCogIcon aria-hidden="true" />}
            title="No matching accounts"
            description="Adjust the search term or role filter to see more results."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead className="hidden md:table-cell">Memberships</TableHead>
                <TableHead className="hidden sm:table-cell">Last sign-in</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.id === actor?.id;
                const activeMemberships = user.memberships.filter(
                  (membership) => membership.status === "ACTIVE",
                );

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {user.name ?? "Unnamed account"}
                        </span>
                        {isSelf ? (
                          <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                            You
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {activeMemberships.length === 0 ? (
                        <span className="text-xs text-muted-foreground">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {activeMemberships.slice(0, 3).map((membership) => (
                            <span
                              key={membership.tenant.id}
                              className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[0.7rem] text-muted-foreground"
                            >
                              {membership.tenant.name}
                            </span>
                          ))}
                          {activeMemberships.length > 3 ? (
                            <span className="text-[0.7rem] text-muted-foreground">
                              +{activeMemberships.length - 3}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={user.role}
                          label={humanise(user.role)}
                          tone={
                            user.role === "PLATFORM_ADMIN"
                              ? "primary"
                              : user.role === "TENANT_ADMIN"
                                ? "info"
                                : "neutral"
                          }
                          showDot={false}
                        />
                        <AdminRoleControl
                          userId={user.id}
                          role={user.role}
                          disabled={isSelf}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <Pagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={total}
          basePath="/admin/administrators"
          params={{ q, role: validRole }}
          itemLabel="account"
        />
      </TableSurface>

      <p className="text-xs leading-relaxed text-muted-foreground">
        An account must keep at least one platform administrator at all times.
        Demoting your own account is blocked by the server.
      </p>
    </div>
  );
}
