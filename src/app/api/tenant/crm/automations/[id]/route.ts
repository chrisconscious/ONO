import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuditAction } from "@prisma/client";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi, serialise } from "@/lib/api/tenant";
import { isServiceError } from "@/lib/api/write-errors";
import { createAuditLog } from "@/server/services/audit/audit.service";
import {
  deleteAutomationWorkflow,
  getAutomationWorkflow,
  updateAutomationWorkflow,
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

/** Returns one workflow and its recent runs. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireTenantApi("PERM-AUTOMATION.READ");
  if (auth.error) return auth.error;

  try {
    const workflow = await getAutomationWorkflow(auth.tenantId, id);
    if (!workflow) return jsonError(404, "Automation not found in this workspace.");
    return Response.json({ workflow: serialise(workflow) });
  } catch (error) {
    console.error("Automation detail error:", error);
    return jsonError(500, "Unable to load the automation.");
  }
}

/** Replaces a workflow definition after server-side validation. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireTenantApi("PERM-AUTOMATION.UPDATE");
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
    const workflow = await updateAutomationWorkflow({
      tenantId: auth.tenantId,
      actorId: auth.actor.id,
      workflowId: id,
      input: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        trigger: parsed.data.trigger,
        conditions: parsed.data.conditions,
        actions: parsed.data.actions,
        isActive: parsed.data.isActive ?? false,
      },
    });

    if ("error" in workflow) return jsonError(404, workflow.error);

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.UPDATE,
      resource: "automation_workflow",
      resourceId: workflow.id,
      ...requestMeta(request),
      metadata: { trigger: workflow.trigger, isActive: workflow.isActive },
    });

    return Response.json({ workflow: serialise(workflow) });
  } catch (error) {
    console.error("Automation update error:", error);
    return jsonError(500, "Unable to update the automation.");
  }
}

/** Deletes a workflow. Run history is removed with it by the schema relation. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireTenantApi("PERM-AUTOMATION.DELETE");
  if (auth.error) return auth.error;

  try {
    const result = await deleteAutomationWorkflow({
      tenantId: auth.tenantId,
      workflowId: id,
    });
    if (isServiceError(result)) return jsonError(404, result.error);

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.DELETE,
      resource: "automation_workflow",
      resourceId: id,
      ...requestMeta(request),
    });

    return Response.json({ deleted: true });
  } catch (error) {
    console.error("Automation delete error:", error);
    return jsonError(500, "Unable to delete the automation.");
  }
}
