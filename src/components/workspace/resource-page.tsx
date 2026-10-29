import { ShieldAlertIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/states";
import { ResourceWorkspace } from "@/components/workspace/resource-workspace";
import { can, requireWorkspace } from "@/lib/auth/guards";
import { permissionCode, RESOURCES, type ResourceKey } from "@/lib/resources/registry";
import type { OptionSource } from "@/lib/resources/registry";
import { getOptionLists } from "@/server/services/tenant/records.service";

/**
 * Server entry point for a tenant business module. Read access is checked
 * before any data is resolved, and the browser only receives the option lists
 * the module needs plus booleans describing what it may do.
 */
export async function ResourcePage({ resourceKey }: { resourceKey: ResourceKey }) {
  const definition = RESOURCES[resourceKey];
  const { membership } = await requireWorkspace(definition.path);

  const canRead = can(
    membership,
    permissionCode(definition.permissionResource, "READ"),
  );

  if (!canRead) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={definition.title}
          description={definition.description}
          breadcrumbs={[
            { label: "Workspace", href: "/app" },
            { label: definition.title },
          ]}
        />
        <div className="rounded-xl border border-border bg-card shadow-xs">
          <EmptyState
            icon={<ShieldAlertIcon aria-hidden="true" />}
            title={`${definition.title} access is not granted`}
            description={`Your workspace role does not include ${definition.title.toLowerCase()} access. Ask a workspace administrator to review your role permissions.`}
          />
        </div>
      </div>
    );
  }

  const sources = [
    ...new Set(
      definition.fields
        .map((field) => field.optionsSource)
        .filter((source): source is OptionSource => Boolean(source)),
    ),
  ];

  const options = sources.length
    ? await getOptionLists(membership.tenantId, sources)
    : {};

  const createPermission =
    definition.createPermission ??
    permissionCode(definition.permissionResource, "CREATE");
  const updatePermission =
    definition.updatePermission ??
    permissionCode(definition.permissionResource, "UPDATE");
  const deletePermission = permissionCode(definition.permissionResource, "DELETE");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={definition.title}
        description={definition.description}
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: definition.module },
          { label: definition.title },
        ]}
      />

      <ResourceWorkspace
        definition={definition}
        options={options}
        permissions={{
          create: definition.allowCreate && can(membership, createPermission),
          update: definition.allowUpdate && can(membership, updatePermission),
          delete: definition.allowDelete && can(membership, deletePermission),
        }}
      />

      <p className="text-xs leading-relaxed text-muted-foreground">
        {definition.title} are scoped to {membership.tenant.name}. Every change is
        checked against your workspace role and written to the tenant audit trail.
      </p>
    </div>
  );
}
