import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuditAction } from "@prisma/client";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi, serialise } from "@/lib/api/tenant";
import { createAuditLog } from "@/server/services/audit/audit.service";
import {
  createAutomationWorkflow,
  listAutomationWorkflows,
} from "@/server/services/crm/automation.service";

const conditionSchema = z.object({
  field: z.string().trim().min(1).max(40),
  operator: z.string().trim().min(1).max(40),
  value: z.string().trim().max(200),
});

const actionSchema = z.object({
  type: z.string().trim().min(1).max(40),
  params: z.record(z.string(), z.string().max(500)).optional(),
});

const workflowSchema = z.object({
  name: z.string().trim().min(1, "Name the workflow.").max(160),
  description: z.string().trim().max(1000).optional(),
  trigger: z.string().trim().min(1, "Choose a trigger."),
  conditions: z.array(conditionSchema).max(5).default([]),
  actions: z.array(actionSchema).min(1, "Add at least one action.").max(5),
  isActive: z.boolean().optional(),
});

/** Lists CRM automation workflows and their recent run history. */
export async function GET() {
  const auth = await requireTenantApi("PERM-AUTOMATION.READ");
  if (auth.error) return auth.error;

  try {
    const workflows = await listAutomationWorkflows(auth.tenantId);
    return Response.json({ workflows: serialise(workflows) });
  } catch (error) {
    console.error("Automation list error:", error);
    return jsonError(500, "Unable to load automations.");
  }
}

/** Creates a disabled-by-default automation workflow. */
export async function POST(request: NextRequest) {
  const auth = await requireTenantApi("PERM-AUTOMATION.CREATE");
  if (auth.error) return auth.error;

  const parsed = workflowSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return jsonError(
      400,
      parsed.error.issues[0]?.message ?? "Check the workflow definition.",
    );
  }

  try {
    const workflow = await createAutomationWorkflow({
      tenantId: auth.tenantId,
      actorId: auth.actor.id,
      input: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        trigger: parsed.data.trigger,
        conditions: parsed.data.conditions,
        actions: parsed.data.actions,
        isActive: parsed.data.isActive ?? false,
      },
    });

    if ("error" in workflow) return jsonError(400, workflow.error);

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.CREATE,
      resource: "automation_workflow",
      resourceId: workflow.id,
      ...requestMeta(request),
      metadata: { trigger: workflow.trigger, isActive: workflow.isActive },
    });

    return Response.json({ workflow: serialise(workflow) }, { status: 201 });
  } catch (error) {
    console.error("Automation create error:", error);
    return jsonError(500, "Unable to create the automation.");
  }
}
