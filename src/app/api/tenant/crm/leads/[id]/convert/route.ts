import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuditAction } from "@prisma/client";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi, serialise } from "@/lib/api/tenant";
import { isServiceError } from "@/lib/api/write-errors";
import { hasPermission } from "@/lib/permissions/authorize";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { convertLead } from "@/server/services/crm/crm.service";

const bodySchema = z.object({
  opportunityName: z.string().trim().max(200).optional(),
  amount: z.union([z.coerce.number().finite().nonnegative(), z.literal("")]).optional(),
  expectedCloseDate: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Enter a valid expected close date.",
    }),
});

/**
 * Converts a qualified lead into an account, contact and opportunity.
 *
 * The operation is explicit and audited. It does not send an email or claim
 * any external delivery.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireTenantApi("PERM-LEAD.UPDATE");
  if (auth.error) return auth.error;

  if (
    !hasPermission(auth.context, "PERM-COMPANY.CREATE") ||
    !hasPermission(auth.context, "PERM-CONTACT.CREATE") ||
    !hasPermission(auth.context, "PERM-OPPORTUNITY.CREATE")
  ) {
    return jsonError(
      403,
      "Converting a lead also needs account, contact and opportunity create permissions.",
    );
  }

  const parsed = bodySchema.safeParse(
    (await request.json().catch(() => null)) ?? {},
  );
  if (!parsed.success) {
    return jsonError(
      400,
      parsed.error.issues[0]?.message ?? "Check the conversion details.",
    );
  }

  try {
    const result = await convertLead({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      leadId: id,
      opportunityName: parsed.data.opportunityName || undefined,
      amount:
        parsed.data.amount === "" || parsed.data.amount === undefined
          ? null
          : Number(parsed.data.amount),
      expectedCloseDate: parsed.data.expectedCloseDate
        ? new Date(parsed.data.expectedCloseDate)
        : null,
    });

    if (isServiceError(result)) {
      return jsonError(
        result.error.includes("not found") ? 404 : 409,
        result.error,
      );
    }

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.CREATE,
      resource: "lead_conversion",
      resourceId: id,
      ...requestMeta(request),
      metadata: {
        companyId: result.companyId,
        contactId: result.contactId,
        opportunityId: result.opportunityId,
      },
    });

    return Response.json(
      {
        lead: serialise(result.lead),
        companyId: result.companyId,
        contactId: result.contactId,
        opportunityId: result.opportunityId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Lead conversion error:", error);
    return jsonError(500, "Unable to convert the lead.");
  }
}
