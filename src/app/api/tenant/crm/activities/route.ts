import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuditAction } from "@prisma/client";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi, serialise } from "@/lib/api/tenant";
import { hasPermission } from "@/lib/permissions/authorize";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { addCrmActivity } from "@/server/services/crm/crm.service";

const bodySchema = z.object({
  referenceType: z.enum(["lead", "contact", "company", "opportunity"]),
  referenceId: z.string().trim().min(1).max(40),
  type: z.enum(["NOTE", "CALL", "MEETING", "EMAIL"]),
  subject: z.string().trim().min(1, "Add a subject.").max(200),
  body: z.string().trim().max(4000).optional(),
});

const permissionFor: Record<
  "lead" | "contact" | "company" | "opportunity",
  string
> = {
  lead: "PERM-LEAD.UPDATE",
  contact: "PERM-CONTACT.UPDATE",
  company: "PERM-COMPANY.UPDATE",
  opportunity: "PERM-OPPORTUNITY.UPDATE",
};

/** Logs a human interaction against a CRM record in the active workspace. */
export async function POST(request: NextRequest) {
  const auth = await requireTenantApi();
  if (auth.error) return auth.error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(
      400,
      parsed.error.issues[0]?.message ?? "Check the submitted activity.",
    );
  }

  const { referenceType, referenceId, type, subject, body } = parsed.data;
  if (!hasPermission(auth.context, permissionFor[referenceType])) {
    return jsonError(
      403,
      "Your workspace role does not allow activity on that record type.",
    );
  }

  try {
    const activity = await addCrmActivity({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      type,
      subject,
      body: body?.trim() || null,
      source: "HUMAN",
      reference: { type: referenceType, id: referenceId, label: subject },
    });

    if (!activity) {
      return jsonError(404, "Record not found in this workspace.");
    }

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.CREATE,
      resource: "crm_activity",
      resourceId: activity.id,
      ...requestMeta(request),
      metadata: { referenceType, referenceId, activityType: type },
    });

    return Response.json({ activity: serialise(activity) }, { status: 201 });
  } catch (error) {
    console.error("CRM activity error:", error);
    return jsonError(500, "Unable to record the activity.");
  }
}
