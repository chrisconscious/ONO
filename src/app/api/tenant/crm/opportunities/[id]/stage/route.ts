import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuditAction, OpportunityStage } from "@prisma/client";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi, serialise } from "@/lib/api/tenant";
import { isServiceError } from "@/lib/api/write-errors";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { changeOpportunityStage } from "@/server/services/crm/crm.service";
import { dispatchRecordEvent } from "@/server/services/crm/automation.service";

const bodySchema = z.object({
  stage: z.nativeEnum(OpportunityStage),
  lostReason: z.string().trim().max(500).optional(),
  wonReason: z.string().trim().max(500).optional(),
});

/** Moves an opportunity to another stage and records the stage history. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireTenantApi("PERM-OPPORTUNITY.UPDATE");
  if (auth.error) return auth.error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(
      400,
      parsed.error.issues[0]?.message ?? "Choose a valid stage.",
    );
  }

  try {
    const result = await changeOpportunityStage({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      opportunityId: id,
      stage: parsed.data.stage,
      lostReason: parsed.data.lostReason || null,
      wonReason: parsed.data.wonReason || null,
      source: "HUMAN",
    });

    if (isServiceError(result)) {
      return jsonError(
        result.error.includes("not found") ? 404 : 409,
        result.error,
      );
    }

    await dispatchRecordEvent({
      tenantId: auth.tenantId,
      actorId: auth.actor.id,
      trigger:
        parsed.data.stage === "CLOSED_WON"
          ? "OPPORTUNITY_WON"
          : "OPPORTUNITY_STAGE_CHANGED",
      recordType: "opportunity",
      recordId: id,
      eventKey: `stage:${parsed.data.stage}:${Date.now()}`,
    }).catch((error) => {
      console.error("Opportunity-stage automation failed:", error);
    });

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.UPDATE,
      resource: "opportunity_stage",
      resourceId: id,
      ...requestMeta(request),
      metadata: { from: result.fromStage, to: result.toStage },
    });

    return Response.json({ opportunity: serialise(result.opportunity) });
  } catch (error) {
    console.error("Opportunity stage error:", error);
    return jsonError(500, "Unable to change the opportunity stage.");
  }
}
