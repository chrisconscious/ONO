import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { z } from "zod";
import { jsonError, requestMeta, resolveApiActor } from "@/lib/auth/api";
import { createAuditLog } from "@/server/services/audit/audit.service";
import {
  applyModerationAction,
  getTestimonialForModeration,
  type ModerationAction,
} from "@/server/services/testimonials/testimonials.service";

const editSchema = z
  .object({
    authorName: z.string().trim().min(2).max(120).optional(),
    authorTitle: z.string().trim().max(120).nullable().optional(),
    company: z.string().trim().max(160).nullable().optional(),
    quote: z.string().trim().min(20).max(600).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    displayOrder: z.coerce.number().int().min(0).max(9999).optional(),
  })
  .strict();

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), note: z.string().trim().min(3).max(500) }),
  z.object({
    action: z.literal("request_changes"),
    note: z.string().trim().min(3).max(500),
  }),
  z.object({ action: z.literal("publish") }),
  z.object({ action: z.literal("unpublish") }),
  z.object({ action: z.literal("feature") }),
  z.object({ action: z.literal("unfeature") }),
  z.object({ action: z.literal("archive") }),
  z.object({ action: z.literal("edit"), edits: editSchema }),
]);

const auditActionFor = (action: ModerationAction): AuditAction => {
  switch (action) {
    case "approve":
    case "publish":
      return AuditAction.APPROVE;
    case "reject":
      return AuditAction.REJECT;
    case "archive":
      return AuditAction.DELETE;
    default:
      return AuditAction.UPDATE;
  }
};

/** Full moderation detail including the audit-backed history. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const { id } = await params;
  const detail = await getTestimonialForModeration(id);
  if (!detail) return jsonError(404, "Testimonial not found.");

  return Response.json(detail);
}

/** Applies one moderation transition and records it in the audit trail. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { actor, response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const { id } = await params;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(
      400,
      parsed.error.issues[0]?.message ?? "Provide a valid moderation action.",
      parsed.error.issues,
    );
  }

  const result = await applyModerationAction({
    id,
    action: parsed.data.action,
    reviewerId: actor.id,
    note: "note" in parsed.data ? parsed.data.note : undefined,
    edits: parsed.data.action === "edit" ? parsed.data.edits : undefined,
  });

  if (!result.ok) {
    const status = result.message === "Testimonial not found." ? 404 : 409;
    return jsonError(status, result.message);
  }

  await createAuditLog({
    tenantId: result.testimonial.tenantId,
    userId: actor.id,
    action: auditActionFor(parsed.data.action),
    resource: "testimonial",
    resourceId: result.testimonial.id,
    ...requestMeta(request),
    metadata: {
      action: parsed.data.action,
      status: result.testimonial.status,
      publishedAt: result.testimonial.publishedAt,
      ...(parsed.data.action === "reject" || parsed.data.action === "request_changes"
        ? { note: parsed.data.note }
        : {}),
      ...(parsed.data.action === "edit" ? { edits: parsed.data.edits } : {}),
    },
  });

  return Response.json({ testimonial: result.testimonial });
}

/**
 * Archives a testimonial. Records are retained for the audit trail rather than
 * physically deleted, which matches the established retention workflow.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { actor, response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const { id } = await params;
  const result = await applyModerationAction({
    id,
    action: "archive",
    reviewerId: actor.id,
  });

  if (!result.ok) {
    const status = result.message === "Testimonial not found." ? 404 : 409;
    return jsonError(status, result.message);
  }

  await createAuditLog({
    tenantId: result.testimonial.tenantId,
    userId: actor.id,
    action: AuditAction.DELETE,
    resource: "testimonial",
    resourceId: result.testimonial.id,
    ...requestMeta(request),
    metadata: { action: "archive", retained: true },
  });

  return Response.json({ testimonial: result.testimonial });
}
