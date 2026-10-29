import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi } from "@/lib/api/tenant";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { runDueAutomations } from "@/server/services/crm/automation.service";

/**
 * Evaluates time-based automation triggers for the active workspace.
 *
 * No scheduler is bundled with this application. The endpoint is protected by
 * the AUTOMATION.UPDATE permission and must be called by an authenticated
 * operator or a trusted scheduler configured outside this codebase.
 */
export async function POST(request: NextRequest) {
  const auth = await requireTenantApi("PERM-AUTOMATION.UPDATE");
  if (auth.error) return auth.error;

  try {
    const counters = await runDueAutomations({
      tenantId: auth.tenantId,
      actorId: auth.actor.id,
    });

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.UPDATE,
      resource: "automation_sweep",
      ...requestMeta(request),
      metadata: counters,
    });

    return Response.json({ counters });
  } catch (error) {
    console.error("Automation sweep error:", error);
    return jsonError(500, "Unable to evaluate due automations.");
  }
}
