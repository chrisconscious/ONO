import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  MessageSquareQuoteIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberRoleEditor } from "@/components/workspace/member-role-editor";
import { RoleManager } from "@/components/workspace/role-manager";
import { WorkspaceProfileForm } from "@/components/workspace/workspace-profile-form";
import { can, requireWorkspace } from "@/lib/auth/guards";
import {
  getWorkspaceTenant,
  listWorkspaceMembers,
} from "@/server/services/workspace/workspace.service";
import {
  listWorkspaceRoleDetails,
  permissionCatalogue,
} from "@/server/services/workspace/governance.service";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Workspace settings",
};

export const dynamic = "force-dynamic";

export default async function WorkspaceSettingsPage() {
  const { actor, membership } = await requireWorkspace("/app/settings");

  const canUpdateIndustry = can(membership, "PERM-INDUSTRY.UPDATE");
  const canReadMembers = can(membership, "PERM-MEMBER.READ");
  const canUpdateMembers = can(membership, "PERM-MEMBER.UPDATE");
  const canReadRoles = can(membership, "PERM-ROLE.READ");
  const canCreateRoles = can(membership, "PERM-ROLE.CREATE");
  const canUpdateRoles = can(membership, "PERM-ROLE.UPDATE");

  const [tenant, members, roles] = await Promise.all([
    getWorkspaceTenant(membership.tenantId),
    canReadMembers ? listWorkspaceMembers(membership.tenantId) : Promise.resolve([]),
    canReadRoles ? listWorkspaceRoleDetails(membership.tenantId) : Promise.resolve([]),
  ]);

  const permissions = canReadRoles ? permissionCatalogue() : [];
  const assignableRoles = roles.map((role) => ({
    id: role.id,
    name: role.name,
    isSystem: role.isSystem,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Workspace settings"
        description="Your organisation's workspace identity, members, roles and public endorsement submissions."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <SectionCard
          title="Workspace profile"
          description="The organisation name and slug are controlled by platform administration."
        >
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Organisation</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {tenant?.name ?? membership.tenant.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Workspace slug</dt>
              <dd className="mt-0.5 font-mono text-xs text-foreground">
                {tenant?.slug ?? membership.tenant.slug}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <StatusBadge status={tenant?.status ?? membership.tenant.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Provisioned</dt>
              <dd className="mt-0.5 text-foreground">
                {tenant ? formatDate(tenant.createdAt) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Your membership</dt>
              <dd className="mt-0.5 text-foreground">
                {membership.roles.join(" · ") || "No role assigned"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-border pt-4">
            <WorkspaceProfileForm
              industry={tenant?.industry ?? ""}
              canEdit={canUpdateIndustry}
            />
          </div>
        </SectionCard>

        <SectionCard title="Your account">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Name</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {actor.name ?? "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="mt-0.5 text-foreground">{actor.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Granted permissions</dt>
              <dd className="mt-0.5 text-foreground">
                {membership.permissions.includes("*")
                  ? "All workspace permissions"
                  : `${membership.permissions.length} permissions`}
              </dd>
            </div>
          </dl>
          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheckIcon
              className="mt-0.5 size-3.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            Access is derived from your membership roles on the server. Contact a
            workspace administrator to change it.
          </p>
        </SectionCard>
      </div>

      <SectionCard
        title="Members"
        description="Accounts with a membership in this workspace."
        bodyClassName="p-0"
      >
        {!canReadMembers ? (
          <p className="flex items-start gap-2 px-4 py-6 text-sm text-muted-foreground">
            <ShieldAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Your role does not include member directory access. Ask a workspace
            administrator with member access to review the team.
          </p>
        ) : members.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No memberships have been created in this workspace yet.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border md:hidden">
              {members.map((member) => {
                const isSelf = member.id === membership.id;
                return (
                  <li key={member.id} className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium break-words text-foreground">
                          {member.user.name ?? member.user.email}
                          {isSelf ? (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              You
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs break-words text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                      <StatusBadge status={member.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {member.roleAssignments.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          No role assigned
                        </span>
                      ) : (
                        member.roleAssignments.map((assignment) => (
                          <span
                            key={assignment.id}
                            className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[0.7rem] text-muted-foreground"
                          >
                            {assignment.role.name}
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">
                        Last sign-in:{" "}
                        {member.user.lastLoginAt
                          ? formatDate(member.user.lastLoginAt)
                          : "Never"}
                      </span>
                      {canUpdateMembers ? (
                        <MemberRoleEditor
                          membershipId={member.id}
                          memberName={member.user.name ?? member.user.email}
                          roleIds={member.roleAssignments.map(
                            (assignment) => assignment.role.id,
                          )}
                          roles={assignableRoles}
                          canEdit={canUpdateMembers}
                          isSelf={isSelf}
                        />
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="hidden md:block">
              <Table aria-label="Workspace members">
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">
                      Last sign-in
                    </TableHead>
                    {canUpdateMembers ? (
                      <TableHead className="text-right">Manage</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const isSelf = member.id === membership.id;
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <p className="font-medium break-words whitespace-normal text-foreground">
                            {member.user.name ?? member.user.email}
                            {isSelf ? (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                You
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs break-words whitespace-normal text-muted-foreground">
                            {member.user.email}
                          </p>
                        </TableCell>
                        <TableCell>
                          {member.roleAssignments.length === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              No role assigned
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {member.roleAssignments.map((assignment) => (
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
                          <StatusBadge status={member.status} />
                        </TableCell>
                        <TableCell className="hidden text-right whitespace-nowrap text-muted-foreground sm:table-cell">
                          {member.user.lastLoginAt
                            ? formatDate(member.user.lastLoginAt)
                            : "Never"}
                        </TableCell>
                        {canUpdateMembers ? (
                          <TableCell className="text-right">
                            <MemberRoleEditor
                              membershipId={member.id}
                              memberName={member.user.name ?? member.user.email}
                              roleIds={member.roleAssignments.map(
                                (assignment) => assignment.role.id,
                              )}
                              roles={assignableRoles}
                              canEdit={canUpdateMembers}
                              isSelf={isSelf}
                            />
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <SectionCard
          title="Roles"
          description="Permission sets available in this workspace."
          bodyClassName="p-0"
        >
          {!canReadRoles ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Your role does not include access to workspace roles.
            </p>
          ) : (
            <RoleManager
              roles={roles}
              permissions={permissions}
              canCreate={canCreateRoles}
              canUpdate={canUpdateRoles}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Testimonials"
          description="Share an endorsement with the platform team and follow the status of your own submissions."
        >
          <p className="text-sm leading-relaxed text-muted-foreground">
            Submission, consent choices and moderation status now live on a dedicated
            page. Only approved submissions you consent to publish appear publicly.
          </p>
          <Button className="mt-4" variant="outline" render={<Link href="/app/testimonials" />}>
            <MessageSquareQuoteIcon aria-hidden="true" />
            Open testimonials
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </SectionCard>
      </div>
    </div>
  );
}
