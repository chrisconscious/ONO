import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  Building2Icon,
  MailIcon,
  PhoneIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { InlineAlert, SectionCard } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import {
  CrmAccessDenied,
  CrmTaskList,
  DetailRows,
  RecordLink,
} from "@/components/workspace/crm-panels";
import { CrmCopilotPanel } from "@/components/workspace/crm-copilot";
import { RecordTimeline } from "@/components/workspace/record-timeline";
import { can, requireWorkspace } from "@/lib/auth/guards";
import { formatDate, formatRelative } from "@/lib/format";
import { getContactDetail } from "@/server/services/crm/crm.service";

export const metadata: Metadata = { title: "Contact" };

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { actor, membership } = await requireWorkspace(`/app/contacts/${id}`);

  if (!can(membership, "PERM-CONTACT.READ")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Contact"
          breadcrumbs={[
            { label: "Workspace", href: "/app" },
            { label: "CRM", href: "/app/crm" },
            { label: "Contacts", href: "/app/contacts" },
            { label: "Record" },
          ]}
        />
        <CrmAccessDenied
          title="Contact access is not granted"
          description="Your workspace role does not include contact access. Ask a workspace administrator to review your permissions."
        />
      </div>
    );
  }

  const detail = await getContactDetail(membership.tenantId, id);
  if (!detail) notFound();

  const { contact, timeline, tasks } = detail;
  const canUpdate = can(membership, "PERM-CONTACT.UPDATE");
  const canReadTasks = can(membership, "PERM-TASK.READ");
  const canReadCompanies = can(membership, "PERM-COMPANY.READ");
  const name = `${contact.firstName} ${contact.lastName}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={name}
        description={
          [contact.title, contact.company?.name].filter(Boolean).join(" · ") ||
          "Contact stored in this workspace."
        }
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "CRM", href: "/app/crm" },
          { label: "Contacts", href: "/app/contacts" },
          { label: name },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            nativeButton={false} render={<Link href="/app/contacts" />}
          >
            <ArrowLeftIcon aria-hidden="true" />
            All contacts
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={contact.status} />
        {contact.title ? (
          <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
            {contact.title}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Account"
          value={contact.company?.name ?? "Not linked"}
          hint="Stored contact-to-account relationship"
        />
        <StatCard
          label="Last contact"
          value={
            contact.lastContactedAt
              ? formatRelative(contact.lastContactedAt)
              : "Never"
          }
          hint={
            contact.lastContactedAt
              ? formatDate(contact.lastContactedAt)
              : "No interaction recorded"
          }
        />
        <StatCard
          label="Owner"
          value={contact.owner?.name ?? contact.owner?.email ?? "Unassigned"}
          hint="Workspace member responsible for this contact"
        />
        <StatCard
          label="Created"
          value={formatDate(contact.createdAt)}
          hint={`Last updated ${formatDate(contact.updatedAt)}`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <SectionCard
            title="Contact details"
            description="Facts stored on this record. Missing fields are left blank rather than inferred."
          >
            <DetailRows
              rows={[
                {
                  label: "Email",
                  value: contact.email ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MailIcon
                        className="size-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {contact.email}
                    </span>
                  ) : (
                    "Not recorded"
                  ),
                },
                {
                  label: "Phone",
                  value: contact.phone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <PhoneIcon
                        className="size-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {contact.phone}
                    </span>
                  ) : (
                    "Not recorded"
                  ),
                },
                {
                  label: "Account",
                  value: contact.company ? (
                    canReadCompanies ? (
                      <RecordLink href={`/app/companies/${contact.company.id}`}>
                        <span className="inline-flex items-center gap-1.5">
                          <Building2Icon
                            className="size-3.5 text-muted-foreground"
                            aria-hidden="true"
                          />
                          {contact.company.name}
                        </span>
                      </RecordLink>
                    ) : (
                      contact.company.name
                    )
                  ) : (
                    "Not linked"
                  ),
                },
                {
                  label: "Owner",
                  value:
                    contact.owner?.name ?? contact.owner?.email ?? "Unassigned",
                },
                { label: "Created", value: formatDate(contact.createdAt) },
                {
                  label: "Last updated",
                  value: formatDate(contact.updatedAt),
                },
                {
                  label: "Notes",
                  value: (
                    <span className="whitespace-pre-wrap">
                      {contact.notes?.trim() || "No notes recorded"}
                    </span>
                  ),
                },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Activity timeline"
            description="Human interactions plus system and automation events recorded against this contact."
          >
            <RecordTimeline
              referenceType="contact"
              referenceId={contact.id}
              initialItems={timeline}
              canWrite={canUpdate}
              currentUserName={actor.name ?? actor.email}
            />
          </SectionCard>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <CrmCopilotPanel
            scope="contact"
            recordId={contact.id}
            contextLabel={`contact ${name}`}
          />

          {canReadTasks ? (
            <SectionCard
              title="Linked tasks"
              description="Follow-up work attached to this contact."
              bodyClassName="p-0 px-4 py-3"
            >
              <CrmTaskList
                tasks={tasks}
                emptyDescription="No task is currently linked to this contact."
              />
            </SectionCard>
          ) : null}

          <InlineAlert tone="info" title="Read-only assistance">
            The copilot answers from records you may read and never edits or
            messages this contact. Logging an interaction records it inside this
            workspace only.
          </InlineAlert>
        </aside>
      </div>
    </div>
  );
}
