import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "@/server/services/audit-service";
import { z } from "zod";

/**
 * Testimonial governance service.
 *
 * Testimonials are public marketing content shown on the authentication page
 * carousel. They are NOT tenant business data, so they carry no tenantId —
 * but that also means only platform-level administrators may create, edit,
 * publish, or withdraw them. Publication is fail-closed: rows default to
 * isPublished = false and only an explicit, audited approval action can make
 * a testimonial visible to unauthenticated visitors.
 */

export const testimonialInputSchema = z.object({
  authorName: z.string().trim().min(2).max(120),
  authorTitle: z.string().trim().min(2).max(160),
  companyName: z.string().trim().min(1).max(160),
  quote: z.string().trim().min(10).max(1200),
  // Approved one-to-five star rating; null means "rating not published".
  rating: z.int().min(1).max(5).nullable().optional(),
  displayOrder: z.int().min(0).max(9999).optional(),
});

export type TestimonialInput = z.infer<typeof testimonialInputSchema>;

/** Fields exposed publicly (never leak moderation metadata to the login page). */
const publicSelect = {
  id: true,
  authorName: true,
  authorTitle: true,
  companyName: true,
  quote: true,
  rating: true,
} as const;

/**
 * Published testimonials for the login-page carousel. Safe to serve to
 * unauthenticated visitors because only explicitly approved rows exist here.
 */
export async function listPublishedTestimonials() {
  return prisma.testimonial.findMany({
    where: { isPublished: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: publicSelect,
    take: 20,
  });
}

/** Full moderation list for the platform-admin portal (includes drafts). */
export async function listAllTestimonials() {
  return prisma.testimonial.findMany({
    orderBy: [{ isPublished: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
  });
}

/**
 * Create a testimonial draft. New submissions are NEVER auto-published —
 * publication requires a separate approve() call with an audit trail.
 */
export async function createTestimonial(input: unknown, actorUserId: string) {
  const data = testimonialInputSchema.parse(input);
  const created = await prisma.testimonial.create({
    data: {
      authorName: data.authorName,
      authorTitle: data.authorTitle,
      companyName: data.companyName,
      quote: data.quote,
      rating: data.rating ?? null,
      displayOrder: data.displayOrder ?? 0,
      isPublished: false,
    },
  });
  await recordAuditEvent({
    userId: actorUserId,
    action: "testimonial.created",
    entityType: "Testimonial",
    entityId: created.id,
    severity: "INFO",
    summary: `Draft testimonial created for ${created.companyName}`,
  });
  return created;
}

/** Update testimonial content. Editing does not change publication state. */
export async function updateTestimonial(id: string, input: unknown, actorUserId: string) {
  const data = testimonialInputSchema.partial().parse(input);
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Testimonial not found");
  const updated = await prisma.testimonial.update({
    where: { id },
    data: {
      ...(data.authorName !== undefined && { authorName: data.authorName }),
      ...(data.authorTitle !== undefined && { authorTitle: data.authorTitle }),
      ...(data.companyName !== undefined && { companyName: data.companyName }),
      ...(data.quote !== undefined && { quote: data.quote }),
      ...(data.rating !== undefined && { rating: data.rating }),
      ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
    },
  });
  await recordAuditEvent({
    userId: actorUserId,
    action: "testimonial.updated",
    entityType: "Testimonial",
    entityId: id,
    summary: "Testimonial content updated",
  });
  return updated;
}

/**
 * Publish a testimonial after explicit approval. Records who approved it and
 * when; this is the ONLY code path allowed to set isPublished = true.
 */
export async function approveTestimonial(id: string, actorUserId: string) {
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Testimonial not found");
  if (existing.isPublished) throw ApiError.conflict("Testimonial is already published");
  const updated = await prisma.testimonial.update({
    where: { id },
    data: { isPublished: true, approvedById: actorUserId, approvedAt: new Date() },
  });
  await recordAuditEvent({
    userId: actorUserId,
    action: "testimonial.approved",
    entityType: "Testimonial",
    entityId: id,
    severity: "WARNING",
    summary: `Testimonial published: ${updated.companyName}`,
  });
  return updated;
}

/** Withdraw publication immediately (e.g. authorization revoked, risk found). */
export async function withdrawTestimonial(id: string, actorUserId: string) {
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Testimonial not found");
  const updated = await prisma.testimonial.update({
    where: { id },
    data: { isPublished: false },
  });
  await recordAuditEvent({
    userId: actorUserId,
    action: "testimonial.withdrawn",
    entityType: "Testimonial",
    entityId: id,
    severity: "WARNING",
    summary: `Testimonial withdrawn from public display: ${updated.companyName}`,
  });
  return updated;
}

/** Delete a testimonial permanently. Only unpublished drafts may be deleted. */
export async function deleteTestimonial(id: string, actorUserId: string) {
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Testimonial not found");
  // Fail-safe: published content must be withdrawn first so the removal is
  // always represented in the audit trail as an explicit withdrawal.
  if (existing.isPublished) {
    throw ApiError.conflict("Withdraw the testimonial before deleting it");
  }
  await prisma.testimonial.delete({ where: { id } });
  await recordAuditEvent({
    userId: actorUserId,
    action: "testimonial.deleted",
    entityType: "Testimonial",
    entityId: id,
    severity: "WARNING",
    summary: "Unpublished testimonial draft deleted",
  });
}
