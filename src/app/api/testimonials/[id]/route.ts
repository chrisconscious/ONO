import type { NextRequest } from "next/server";
import { AuditAction, TestimonialStatus } from "@prisma/client";
import { z } from "zod";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi } from "@/lib/api/tenant";
import { createAuditLog } from "@/server/services/audit/audit.service";
import {
  reviseOwnTestimonial,
  withdrawTestimonialConsent,
} from "@/server/services/testimonials/testimonials.service";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("withdraw_consent") }),
  z.object({
    action: z.literal("revise"),
    authorName: z.string().trim().min(2).max(120),
    authorTitle: z.string().trim().max(120).optional().or(z.literal("")),
    quote: z.string().trim().min(20).max(600),
    rating: z.coerce.number().int().min(1).max(5),
    consentToPublish: z.literal(true),
    consentName: z.boolean().default(true),
    consentTitle: z.boolean().default(true),
    consentCompany: z.boolean().default(true),
  }),
]);

/** An author withdraws consent or revises a submission returned for changes. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await requireTenantApi("PERM-TESTIMONIAL.SUBMIT");
  if (result.error) return result.error;

  const { id } = await params;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  if (parsed.data.action === "withdraw_consent") {
    const testimonial = await withdrawTestimonialConsent({
      id,
      tenantId: result.tenantId,
      userId: result.actor.id,
    });

    if (!testimonial) return jsonError(404, "Testimonial not found.");

    await createAuditLog({
      tenantId: result.tenantId,
      userId: result.actor.id,
      action: AuditAction.UPDATE,
      resource: "testimonial",
      resourceId: testimonial.id,
      ...requestMeta(request),
      metadata: { consentWithdrawn: true, unpublished: true },
    });

    return Response.json({
      testimonial: {
        id: testimonial.id,
        status: testimonial.status,
        consentToPublish: testimonial.consentToPublish,
        publishedAt: testimonial.publishedAt,
      },
    });
  }

  const revised = await reviseOwnTestimonial({
    id,
    tenantId: result.tenantId,
    userId: result.actor.id,
    authorName: parsed.data.authorName,
    authorTitle: parsed.data.authorTitle || null,
    quote: parsed.data.quote,
    rating: parsed.data.rating,
    consentToPublish: parsed.data.consentToPublish,
    consentName: parsed.data.consentName,
    consentTitle: parsed.data.consentTitle,
    consentCompany: parsed.data.consentCompany,
  });

  if (!revised.ok) return jsonError(409, revised.message);

  await createAuditLog({
    tenantId: result.tenantId,
    userId: result.actor.id,
    action: AuditAction.UPDATE,
    resource: "testimonial",
    resourceId: revised.testimonial.id,
    ...requestMeta(request),
    metadata: { resubmitted: true, status: TestimonialStatus.PENDING },
  });

  return Response.json({
    testimonial: {
      id: revised.testimonial.id,
      status: revised.testimonial.status,
    },
  });
}
