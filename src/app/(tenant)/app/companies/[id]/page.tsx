import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  Building2Icon,
  GlobeIcon,
  MailIcon,
  PhoneIcon,
  TargetIcon,
  UsersIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState, InlineAlert, SectionCard } from "@/components/app/states";
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
import { methodLabel } from "@/lib/crm/presentation";
import {
  formatCurrency,
  formatDate,
  formatRelative,
} from "@/lib/format";
import { getCompanyDetail } from "@/server/services/crm/crm.service";

export const metadata: Metadata = { title: "Account" };

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { actor, membership } = await requireWorkspace(`/app/companies/${id}`);

  if (!can(membership, "PERM-COMPANY.READ")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Account"
          breadcrumbs={[
            { label: "Workspace", href: "/app" },
            { label: "CRM", href: "/app/crm" },
            { label: "Companies", href: "/app/companies" },
            { label: "Record" },
          ]}
        />
        <CrmAccessDenied
          title="Account access is not granted"
          description="Your workspace role does not include account access. Ask a workspace administrator to review your permissions."
        />
      </div>
    );
  }

  const detail = await getCompanyDetail(membership.tenantId, id);
  if (!detail) notFound();

  const { company, timeline, tasks } = detail;
  const canUpdate = can(membership, "PERM-COMPANY.UPDATE");
  const canReadContacts = can(membership, "PERM-CONTACT.READ");
  const canReadOpportunities = can(membership, "PERM-OPPORTUNITY.READ");
  const canReadTasks = can(membership, "PERM-TASK.READ");

  const openOpportunities = company.opportunities.filter(
    (opportunity) =>
      opportunity.stage !== "CLOSED_WON" && opportunity.stage !== "CLOSED_LOST",
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={company.name}
        description={
          [company.industry, company.size].filter(Boolean).join(" · ") ||
          "Account stored in this workspace."
        }
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "CRM", href: "/app/crm" },
          { label: "Companies", href: "/app/companies" },
          { label: company.name },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/app/companies" />}
          >
            <ArrowLeftIcon aria-hidden="true" />
            All accounts
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={company.status} />
        {company.industry ? (
          <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
            {company.industry}
          </span>
        ) : null}
        {company.size ? (
          <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
            {company.size}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Contacts"
          value={canReadContacts ? company.contacts.length : "—"}
          hint={
            canReadContacts
              ? "People linked to this account"
              : "Contact access is not granted"
          }
        />
        <StatCard
          label="Open opportunities"
          value={canReadOpportunities ? openOpportunities.length : "—"}
          hint={
            canReadOpportunities
              ? `${company.opportunities.length} total recorded`
              : "Opportunity access is not granted"
          }
        />
        <StatCard
          label="Last interaction"
          value={
            company.lastInteractionAt
              ? formatRelative(company.lastInteractionAt)
              : "Never"
          }
          hint={
            company.lastInteractionAt
              ? formatDate(company.lastInteractionAt)
              : "No interaction recorded"
          }
        />
        <StatCard
          label="Owner"
          value={company.owner?.name ?? company.owner?.email ?? "Unassigned"}
          hint={`Created ${formatDate(company.createdAt)}`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <SectionCard
            title="Account details"
            description="Facts stored on this record. Missing fields are left blank rather than inferred."
          >
            <DetailRows
              rows={[
                {
                  label: "Email",
                  value: company.email ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MailIcon
                        className="size-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {company.email}
                    </span>
                  ) : (
                    "Not recorded"
                  ),
                },
                {
                  label: "Phone",
                  value: company.phone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <PhoneIcon
                        className="size-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {company.phone}
                    </span>
                  ) : (
                    "Not recorded"
                  ),
                },
                {
                  label: "Website",
                  value: company.website ? (
                    <span className="inline-flex items-center gap-1.5 break-all">
                      <GlobeIcon
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {company.website}
                    </span>
                  ) : (
                    "Not recorded"
                  ),
                },
                {
                  label: "Owner",
                  value:
                    company.owner?.name ?? company.owner?.email ?? "Unassigned",
                },
                { label: "Created", value: formatDate(company.createdAt) },
                {
                  label: "Last updated",
                  value: formatDate(company.updatedAt),
                },
                {
                  label: "Notes",
                  value: (
                    <span className="whitespace-pre-wrap">
                      {company.notes?.trim() || "No notes recorded"}
                    </span>
                  ),
                },
              ]}
            />
          </SectionCard>

          {canReadContacts ? (
            <SectionCard
              title="Contacts"
              description="People linked to this account."
              bodyClassName="p-0"
            >
              {company.contacts.length === 0 ? (
                <EmptyState
                  icon={<UsersIcon aria-hidden="true" />}
                  title="No contacts linked"
                  description="Contacts created or converted for this account will appear here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {company.contacts.map((contact) => (
                    <li
                      key={contact.id}
                      className="flex flex-wrap items-start justify-between gap-2 px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <RecordLink href={`/app/contacts/${contact.id}`}>
                          {contact.firstName} {contact.lastName}
                        </RecordLink>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {contact.title ?? "No title"} ·{" "}
                          {contact.email ?? contact.phone ?? "No contact details"}
                        </p>
                      </div>
                      <StatusBadge status={contact.status} />
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          ) : null}

          {canReadOpportunities ? (
            <SectionCard
              title="Opportunities"
              description="Deals recorded against this account."
              bodyClassName="p-0"
            >
              {company.opportunities.length === 0 ? (
                <EmptyState
                  icon={<TargetIcon aria-hidden="true" />}
                  title="No opportunities linked"
                  description="Deals associated with this account will appear here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {company.opportunities.map((opportunity) => (
                    <li key={opportunity.id} className="px-4 py-2.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <RecordLink
                          href={`/app/opportunities/${opportunity.id}`}
                        >
                          {opportunity.name}
                        </RecordLink>
                        <span className="text-sm font-medium text-foreground tabular">
                          {formatCurrency(
                            opportunity.amount == null
                              ? null
                              : Number(opportunity.amount),
                            opportunity.currency,
                          )}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={opportunity.stage} />
                        <span className="text-[0.7rem] text-muted-foreground">
                          {opportunity.winProbability != null
                            ? `${opportunity.winProbability}% ${methodLabel("RULE_BASELINE_V1").toLowerCase()}`
                            : "Win baseline not calculated"}
                          {opportunity.expectedCloseDate
                            ? ` · closes ${formatDate(opportunity.expectedCloseDate)}`
                            : ""}
                          {opportunity.owner?.name
                            ? ` · ${opportunity.owner.name}`
                            : ""}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          ) : null}

          <SectionCard
            title="Activity timeline"
            description="Human interactions plus system and automation events recorded against this account."
          >
            <RecordTimeline
              referenceType="company"
              referenceId={company.id}
              initialItems={timeline}
              canWrite={canUpdate}
              currentUserName={actor.name ?? actor.email}
            />
          </SectionCard>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <CrmCopilotPanel
            scope="company"
            recordId={company.id}
            contextLabel={`account ${company.name}`}
          />

          {canReadTasks ? (
            <SectionCard
              title="Linked tasks"
              description="Follow-up work attached to this account."
              bodyClassName="p-0 px-4 py-3"
            >
              <CrmTaskList
                tasks={tasks}
                emptyDescription="No task is currently linked to this account."
              />
            </SectionCard>
          ) : null}

          <InlineAlert tone="info" title="Permission-aware record">
            <p className="flex items-start gap-1.5">
              <Building2Icon
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              Contacts, opportunities and tasks are shown only when your role can
              read those record types. Aggregated figures elsewhere do not grant
              access to individual records.
            </p>
          </InlineAlert>
        </aside>
      </div>
    </div>
  );
}
