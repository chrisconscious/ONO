import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuditAction } from "@prisma/client";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi } from "@/lib/api/tenant";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { runWorkflowManually } from "@/server/services/crm/automation.service";

const bodySchema = z.object({
  recordType: z.enum(["lead", "opportunity"]),
  recordId: z.string().trim().min(1).max(40),
});

/**
 * Runs one active workflow against one explicit record.
 *
 * Manual runs are audited and keep the same idempotency and action-safety
 * rules as event-driven runs.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireTenantApi("PERM-AUTOMATION.UPDATE");
  if (auth.error) return auth.error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(
      400,
      parsed.error.issues[0]?.message ?? "Choose a record to run against.",
    );
  }

  try {
    const result = await runWorkflowManually({
      tenantId: auth.tenantId,
      actorId: auth.actor.id,
      workflowId: id,
      recordType: parsed.data.recordType,
      recordId: parsed.data.recordId,
    });

    if ("error" in result) return jsonError(409, result.error);

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.UPDATE,
      resource: "automation_run",
      resourceId: id,
      ...requestMeta(request),
      metadata: {
        recordType: parsed.data.recordType,
        recordId: parsed.data.recordId,
        status: result.status,
        runId: result.runId,
      },
    });

    return Response.json(result);
  } catch (error) {
    console.error("Automation manual run error:", error);
    return jsonError(500, "Unable to run the automation.");
  }
}
