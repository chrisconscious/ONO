import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { z } from "zod";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { getCurrentActor } from "@/lib/auth/session";
import { getActorContext } from "@/lib/permissions/authorize";
import { createAuditLog } from "@/server/services/audit/audit.service";
import {
  createTestimonialSubmission,
  listPublishedTestimonials,
} from "@/server/services/testimonials/testimonials.service";

/**
 * Public, unauthenticated testimonials endpoint used by the sign-in screen.
 * Only approved, published and consented testimonials are exposed.
 */
export async function GET() {
  try {
    const testimonials = await listPublishedTestimonials();
    return Response.json({ testimonials });
  } catch (error) {
    console.error("Public testimonials error:", error);
    return jsonError(500, "Unable to load testimonials.");
  }
}

const submitSchema = z.object({
  authorName: z.string().trim().min(2).max(120),
  authorTitle: z.string().trim().max(120).optional().or(z.literal("")),
  quote: z.string().trim().min(20, "Write at least 20 characters.").max(600),
  rating: z.coerce.number().int().min(1).max(5),
  consentToPublish: z.boolean().refine((value) => value === true, {
    message: "Publication consent is required.",
  }),
  consentName: z.boolean().default(true),
  consentTitle: z.boolean().default(true),
  consentCompany: z.boolean().default(true),
});

/**
 * A workspace member submits an endorsement. The company is always derived
 * from the authenticated tenant; browsers cannot select another organisation.
 */
export async function POST(request: NextRequest) {
  const actor = await getCurrentActor();
  if (!actor) return jsonError(401, "Authentication required.");

  const context = await getActorContext(actor.id);
  const membership = context.tenantId
    ? actor.memberships.find((item) => item.tenantId === context.tenantId)
    : undefined;

  if (!membership || !context.tenantId) {
    return jsonError(403, "An active workspace membership is required.");
  }

  if (membership.tenant.status === "SUSPENDED" || membership.tenant.status === "CLOSED") {
    return jsonError(403, "This workspace is not accepting submissions.");
  }

  const parsed = submitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(
      400,
      parsed.error.issues[0]?.message ?? "Check the testimonial details.",
      parsed.error.issues,
    );
  }

  try {
    const testimonial = await createTestimonialSubmission({
      tenantId: membership.tenantId,
      submittedById: actor.id,
      authorName: parsed.data.authorName,
      authorTitle: parsed.data.authorTitle || null,
      // The authorised company identity comes from the membership, not the form.
      company: membership.tenant.name,
      quote: parsed.data.quote,
      rating: parsed.data.rating,
      consentToPublish: parsed.data.consentToPublish,
      consentName: parsed.data.consentName,
      consentTitle: parsed.data.consentTitle,
      consentCompany: parsed.data.consentCompany,
    });

    await createAuditLog({
      tenantId: membership.tenantId,
      userId: actor.id,
      action: AuditAction.CREATE,
      resource: "testimonial",
      resourceId: testimonial.id,
      ...requestMeta(request),
      metadata: { status: testimonial.status, consent: parsed.data.consentToPublish },
    });

    return Response.json(
      {
        testimonial: {
          id: testimonial.id,
          status: testimonial.status,
          createdAt: testimonial.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Testimonial submission error:", error);
    return jsonError(500, "Unable to submit the testimonial right now.");
  }
}
