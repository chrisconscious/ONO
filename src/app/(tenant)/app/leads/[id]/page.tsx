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
  ScoreFactorList,
} from "@/components/workspace/crm-panels";
import { CrmCopilotPanel } from "@/components/workspace/crm-copilot";
import { LeadConvertDialog } from "@/components/workspace/lead-convert-dialog";
import { RecordTimeline } from "@/components/workspace/record-timeline";
import { can, requireWorkspace } from "@/lib/auth/guards";
import { methodLabel, readScoreFactors } from "@/lib/crm/presentation";
import {
  formatCurrency,
  formatDate,
  formatRelative,
} from "@/lib/format";
import { getLeadDetail } from "@/server/services/crm/crm.service";

export const metadata: Metadata = { title: "Lead" };

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { actor, membership } = await requireWorkspace(`/app/leads/${id}`);

  if (!can(membership, "PERM-LEAD.READ")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Lead"
          breadcrumbs={[
            { label: "Workspace", href: "/app" },
            { label: "CRM", href: "/app/crm" },
            { label: "Leads", href: "/app/leads" },
            { label: "Record" },
          ]}
        />
        <CrmAccessDenied
          title="Lead access is not granted"
          description="Your workspace role does not include lead access. Ask a workspace administrator to review your permissions."
        />
      </div>
    );
  }

  const detail = await getLeadDetail(membership.tenantId, id);
  if (!detail) notFound();

  const { lead, timeline, tasks } = detail;
  const canUpdate = can(membership, "PERM-LEAD.UPDATE");
  const canReadTasks = can(membership, "PERM-TASK.READ");
  const canConvert =
    canUpdate &&
    !lead.convertedAt &&
    lead.status !== "CONVERTED" &&
    can(membership, "PERM-COMPANY.CREATE") &&
    can(membership, "PERM-CONTACT.CREATE") &&
    can(membership, "PERM-OPPORTUNITY.CREATE");

  const factors = readScoreFactors(lead.scoreFactors);
  const converted =
    lead.status === "CONVERTED" || lead.convertedAt != null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${lead.firstName} ${lead.lastName}`}
        description={
          [lead.jobTitle, lead.companyName].filter(Boolean).join(" · ") ||
          "Lead captured in this workspace."
        }
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "CRM", href: "/app/crm" },
          { label: "Leads", href: "/app/leads" },
          { label: `${lead.firstName} ${lead.lastName}` },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false} render={<Link href="/app/leads" />}
            >
              <ArrowLeftIcon aria-hidden="true" />
              All leads
            </Button>
            {canConvert ? (
              <LeadConvertDialog
                leadId={lead.id}
                defaultOpportunityName={
                  lead.companyName
                    ? `${lead.companyName} opportunity`
                    : `${lead.firstName} ${lead.lastName} opportunity`
                }
                defaultAmount={
                  lead.estimatedValue ? String(lead.estimatedValue) : undefined
                }
              />
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={lead.status} />
        {lead.source ? (
          <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
            Source: {lead.source}
          </span>
        ) : null}
        {lead.industry ? (
          <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
            {lead.industry}
          </span>
        ) : null}
        {converted ? (
          <StatusBadge
            status="CONVERTED"
            label="Converted to an opportunity"
            tone="success"
          />
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Rule baseline score"
          value={lead.score ?? "—"}
          hint={`${methodLabel(lead.scoreMethod)} · ${lead.scoreSampleSize} historical lead${lead.scoreSampleSize === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Estimated value"
          value={formatCurrency(
            lead.estimatedValue == null ? null : Number(lead.estimatedValue),
            lead.currency,
          )}
          hint="Recorded by the team, not predicted"
        />
        <StatCard
          label="Last contact"
          value={
            lead.lastContactedAt ? formatRelative(lead.lastContactedAt) : "Never"
          }
          hint={
            lead.lastContactedAt
              ? formatDate(lead.lastContactedAt)
              : "No interaction recorded"
          }
        />
        <StatCard
          label="Owner"
          value={lead.owner?.name ?? lead.owner?.email ?? "Unassigned"}
          hint={
            lead.expectedConversionDate
              ? `Expected conversion ${formatDate(lead.expectedConversionDate)}`
              : "No expected conversion date"
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <SectionCard
            title="Lead details"
            description="Facts stored on this record. Missing fields are left blank rather than inferred."
          >
            <DetailRows
              rows={[
                {
                  label: "Email",
                  value: lead.email ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MailIcon
                        className="size-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {lead.email}
                    </span>
                  ) : (
                    "Not recorded"
                  ),
                },
                {
                  label: "Phone",
                  value: lead.phone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <PhoneIcon
                        className="size-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {lead.phone}
                    </span>
                  ) : (
                    "Not recorded"
                  ),
                },
                {
                  label: "Company",
                  value: lead.companyName ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2Icon
                        className="size-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {lead.companyName}
                    </span>
                  ) : (
                    "Not recorded"
                  ),
                },
                {
                  label: "Owner",
                  value: lead.owner?.name ?? lead.owner?.email ?? "Unassigned",
                },
                { label: "Created", value: formatDate(lead.createdAt) },
                {
                  label: "Qualified",
                  value: lead.qualifiedAt
                    ? formatDate(lead.qualifiedAt)
                    : "Not qualified",
                },
                {
                  label: "Expected conversion",
                  value: lead.expectedConversionDate
                    ? formatDate(lead.expectedConversionDate)
                    : "Not recorded",
                },
                {
                  label: "Last updated",
                  value: formatDate(lead.updatedAt),
                },
                {
                  label: "Lost reason",
                  value: lead.lostReason ?? "Not recorded",
                },
                {
                  label: "Notes",
                  value: (
                    <span className="whitespace-pre-wrap">
                      {lead.notes?.trim() || "No notes recorded"}
                    </span>
                  ),
                },
              ]}
            />
          </SectionCard>

          {converted ? (
            <SectionCard
              title="Conversion links"
              description="Records created by the audited lead conversion."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                    Account
                  </p>
                  {lead.convertedCompany ? (
                    <RecordLink
                      href={`/app/companies/${lead.convertedCompany.id}`}
                      className="mt-1 block truncate text-sm"
                    >
                      {lead.convertedCompany.name}
                    </RecordLink>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Not linked
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                    Contact
                  </p>
                  {lead.convertedContact ? (
                    <RecordLink
                      href={`/app/contacts/${lead.convertedContact.id}`}
                      className="mt-1 block truncate text-sm"
                    >
                      {lead.convertedContact.firstName}{" "}
                      {lead.convertedContact.lastName}
                    </RecordLink>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Not linked
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                    Opportunity
                  </p>
                  {lead.convertedOpportunity ? (
                    <RecordLink
                      href={`/app/opportunities/${lead.convertedOpportunity.id}`}
                      className="mt-1 block truncate text-sm"
                    >
                      {lead.convertedOpportunity.name}
                    </RecordLink>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Not linked
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard
            title="Why this score"
            description="Every contribution stored by the latest baseline calculation."
          >
            <ScoreFactorList factors={factors} />
            <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
              Method: {methodLabel(lead.scoreMethod)}.{" "}
              {lead.scoreUpdatedAt
                ? `Recalculated ${formatRelative(lead.scoreUpdatedAt)} from ${lead.scoreSampleSize} historical lead${lead.scoreSampleSize === 1 ? "" : "s"}.`
                : "The score has not been recalculated yet."}{" "}
              This is not a trained machine-learning prediction and must not be
              treated as a guarantee.
            </p>
          </SectionCard>

          <SectionCard
            title="Activity timeline"
            description="Human interactions plus system and automation events recorded against this lead."
          >
            <RecordTimeline
              referenceType="lead"
              referenceId={lead.id}
              initialItems={timeline}
              canWrite={canUpdate}
              currentUserName={actor.name ?? actor.email}
            />
          </SectionCard>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <CrmCopilotPanel
            scope="lead"
            recordId={lead.id}
            contextLabel={`lead ${lead.firstName} ${lead.lastName}`}
          />

          {canReadTasks ? (
            <SectionCard
              title="Linked tasks"
              description="Follow-up work attached to this lead."
              bodyClassName="p-0 px-4 py-3"
            >
              <CrmTaskList
                tasks={tasks}
                emptyDescription="No task is currently linked to this lead."
              />
            </SectionCard>
          ) : null}

          <InlineAlert tone="info" title="Read-only assistance">
            The copilot answers from this record and the records you may read. It
            never updates, converts or messages anyone. Conversion and stage
            changes require explicit confirmation through the audited actions on
            this page.
          </InlineAlert>

          {!converted && !canConvert ? (
            <InlineAlert tone="warning" title="Conversion is not available">
              Converting this lead also needs lead update plus account, contact
              and opportunity create permissions. Ask a workspace administrator
              if this is unexpected.
            </InlineAlert>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
