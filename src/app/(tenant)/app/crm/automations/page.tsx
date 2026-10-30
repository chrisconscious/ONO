import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { InlineAlert } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { AutomationManager } from "@/components/workspace/automation-manager";
import { CrmAccessDenied } from "@/components/workspace/crm-panels";
import { can, requireWorkspace } from "@/lib/auth/guards";
import { listAutomationWorkflows } from "@/server/services/crm/automation.service";
import { getOptionLists } from "@/server/services/tenant/records.service";

export const metadata: Metadata = { title: "CRM automations" };

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const { membership } = await requireWorkspace("/app/crm/automations");

  if (!can(membership, "PERM-AUTOMATION.READ")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="CRM automations"
          breadcrumbs={[
            { label: "Workspace", href: "/app" },
            { label: "CRM", href: "/app/crm" },
            { label: "Automations" },
          ]}
        />
        <CrmAccessDenied
          title="Automation access is not granted"
          description="Your workspace role does not include automation access. Ask a workspace administrator to review your permissions."
        />
      </div>
    );
  }

  const [workflows, options] = await Promise.all([
    listAutomationWorkflows(membership.tenantId),
    getOptionLists(membership.tenantId, ["members"]),
  ]);

  const activeCount = workflows.filter((workflow) => workflow.isActive).length;
  const totalRuns = workflows.reduce(
    (sum, workflow) => sum + workflow._count.runs,
    0,
  );
  const recentFailures = workflows.reduce(
    (sum, workflow) =>
      sum + workflow.runs.filter((run) => run.status === "FAILED").length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="CRM automations"
        description="Server-side workflows that react to recorded CRM events. Every definition is validated again by the API, executed in a transaction and retained in run history."
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "CRM", href: "/app/crm" },
          { label: "Automations" },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/app/crm" />}
          >
            <ArrowLeftIcon aria-hidden="true" />
            CRM workspace
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Workflows" value={workflows.length} />
        <StatCard
          label="Active"
          value={activeCount}
          hint={`${workflows.length - activeCount} paused or draft`}
        />
        <StatCard
          label="Recorded runs"
          value={totalRuns}
          hint="All retained workflow executions"
        />
        <StatCard
          label="Recent failures"
          value={recentFailures}
          hint="In the latest five runs per workflow"
        />
      </div>

      <InlineAlert tone="info" title="Execution and safety limits">
        <p>
          Workflows run inside this application when a matching write is recorded,
          or when an authorised operator runs the due-check sweep or a manual
          test. No external scheduler is bundled, so time-based triggers need an
          operator or trusted scheduler to call the sweep endpoint. Actions are
          limited to internal tasks, in-app notifications, lead owner/status
          changes and the opportunity next step. No email, SMS, WhatsApp or
          calendar message is sent, and no delivery is claimed.
        </p>
        <p className="mt-2">
          Repeated events are deduplicated with an idempotency key. Failed runs
          are retained with their error text and are not retried indefinitely.
          Tenant boundaries are enforced on every read and write.
        </p>
      </InlineAlert>

      <AutomationManager
        initialWorkflows={workflows}
        members={options.members ?? []}
        permissions={{
          create: can(membership, "PERM-AUTOMATION.CREATE"),
          update: can(membership, "PERM-AUTOMATION.UPDATE"),
          delete: can(membership, "PERM-AUTOMATION.DELETE"),
        }}
      />
    </div>
  );
}
