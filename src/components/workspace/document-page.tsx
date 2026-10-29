import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ShieldAlertIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { DocumentLines } from "@/components/workspace/document-lines";
import { can, requireWorkspace } from "@/lib/auth/guards";
import {
  DOCUMENTS,
  type DocumentKey,
} from "@/lib/resources/documents";
import { permissionCode, RESOURCES } from "@/lib/resources/registry";
import { getDocument } from "@/server/services/tenant/document-lines.service";
import { getOptionLists } from "@/server/services/tenant/records.service";
import { formatDate, formatDateTime } from "@/lib/format";

/**
 * Server entry point for a priced document detail page. The document and its
 * option lists are resolved with the active tenant, and edit access is decided
 * before the line editor is rendered.
 */
export async function DocumentPage({
  resourceKey,
  documentId,
}: {
  resourceKey: DocumentKey;
  documentId: string;
}) {
  const config = DOCUMENTS[resourceKey];
  const definition = RESOURCES[resourceKey];
  const { membership } = await requireWorkspace(`${config.path}/[id]`);

  const canRead = can(
    membership,
    permissionCode(definition.permissionResource, "READ"),
  );

  if (!canRead) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={config.title} />
        <div className="rounded-xl border border-border bg-card shadow-xs">
          <EmptyState
            icon={<ShieldAlertIcon aria-hidden="true" />}
            title={`${config.title} access is not granted`}
            description="Your workspace role does not include access to this document. Ask a workspace administrator to review your role permissions."
          />
        </div>
      </div>
    );
  }

  const document = await getDocument(resourceKey, membership.tenantId, documentId);
  if (!document) notFound();

  const options = config.supportsProduct
    ? await getOptionLists(membership.tenantId, ["products"])
    : {};

  const canEdit = can(
    membership,
    definition.updatePermission ??
      permissionCode(definition.permissionResource, "UPDATE"),
  );

  const meta: Array<{ label: string; value: string }> = [];
  if (document.partyLabel && document.partyName) {
    meta.push({ label: document.partyLabel, value: document.partyName });
  }
  if (document.validUntil) {
    meta.push({ label: "Valid until", value: formatDate(document.validUntil) });
  }
  if (document.orderDate) {
    meta.push({ label: "Order date", value: formatDate(document.orderDate) });
  }
  if (document.expectedDate) {
    meta.push({ label: "Expected", value: formatDate(document.expectedDate) });
  }
  if (document.issueDate) {
    meta.push({ label: "Issued", value: formatDate(document.issueDate) });
  }
  if (document.dueDate) {
    meta.push({ label: "Due", value: formatDate(document.dueDate) });
  }
  meta.push({ label: "Currency", value: document.currency });
  meta.push({ label: "Created", value: formatDateTime(document.createdAt) });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${config.title} ${document.number}`}
        description={definition.description}
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: definition.module },
          { label: definition.title, href: config.path },
          { label: document.number },
        ]}
        actions={
          <Button variant="outline" render={<Link href={config.path} />}>
            <ArrowLeftIcon aria-hidden="true" />
            Back to {definition.title.toLowerCase()}
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{document.number}</span>
            <StatusBadge status={document.status} />
          </div>
          <span className="text-xs text-muted-foreground">
            Updated {formatDateTime(document.updatedAt)}
          </span>
        </div>
        <dl className="grid gap-4 px-4 py-4 sm:grid-cols-2 xl:grid-cols-3">
          {meta.map((entry) => (
            <div key={entry.label}>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {entry.label}
              </dt>
              <dd className="mt-0.5 text-sm text-foreground">{entry.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <DocumentLines
        key={document.updatedAt}
        resourceKey={resourceKey}
        documentId={document.id}
        initialDocument={document}
        canEdit={canEdit}
        products={options.products ?? []}
        lineLabel={config.lineLabel}
      />

      <p className="text-xs leading-relaxed text-muted-foreground">
        Lines are scoped to {membership.tenant.name}. Adding, editing or deleting a line is
        checked against your workspace role and recorded in the tenant audit trail.
      </p>
    </div>
  );
}
