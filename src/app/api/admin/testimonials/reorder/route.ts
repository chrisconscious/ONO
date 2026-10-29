import type { NextRequest } from "next/server";
import { AuditAction, TestimonialStatus } from "@prisma/client";
import { z } from "zod";
import { jsonError, requestMeta, resolveApiActor } from "@/lib/auth/api";
import { prisma } from "@/lib/database/prisma";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { reorderTestimonials } from "@/server/services/testimonials/testimonials.service";

const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

/** Persists the display order of published testimonials in one transaction. */
export async function POST(request: NextRequest) {
  const { actor, response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const parsed = reorderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, "Provide the ordered testimonial identifiers.");
  }

  const uniqueIds = [...new Set(parsed.data.ids)];
  if (uniqueIds.length !== parsed.data.ids.length) {
    return jsonError(400, "Each testimonial may appear only once in the order.");
  }

  const published = await prisma.testimonial.findMany({
    where: {
      id: { in: uniqueIds },
      status: TestimonialStatus.APPROVED,
      publishedAt: { not: null },
    },
    select: { id: true, tenantId: true },
  });

  if (published.length !== uniqueIds.length) {
    return jsonError(
      409,
      "Only published, approved testimonials can be reordered.",
    );
  }

  await reorderTestimonials(uniqueIds);

  await createAuditLog({
    tenantId: published[0]?.tenantId ?? null,
    userId: actor.id,
    action: AuditAction.UPDATE,
    resource: "testimonial",
    resourceId: uniqueIds[0],
    ...requestMeta(request),
    metadata: { action: "reorder", ids: uniqueIds },
  });

  return Response.json({ order: uniqueIds });
}
