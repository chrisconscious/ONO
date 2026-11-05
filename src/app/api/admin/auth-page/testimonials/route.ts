import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { z } from "zod";
import {
  assertSameOrigin,
  jsonError,
  jsonNoStore,
  requestMeta,
  resolveApiActor,
} from "@/lib/auth/api";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { createPlatformTestimonial } from "@/server/services/testimonials/testimonials.service";

const createSchema = z
  .object({
    authorName: z.string().trim().min(2).max(120),
    authorTitle: z.string().trim().max(120).optional(),
    company: z.string().trim().max(160).optional(),
    quote: z.string().trim().min(20).max(600),
    rating: z.coerce.number().int().min(1).max(5),
  })
  .strict();

/** Creates a published, platform-authored testimonial for the auth page. */
export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { actor, response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(
      400,
      parsed.error.issues[0]?.message ?? "Check the testimonial details.",
      parsed.error.issues,
    );
  }

  const testimonial = await createPlatformTestimonial({
    actorId: actor.id,
    authorName: parsed.data.authorName,
    authorTitle: parsed.data.authorTitle || null,
    company: parsed.data.company || null,
    quote: parsed.data.quote,
    rating: parsed.data.rating,
  });

  await createAuditLog({
    userId: actor.id,
    action: AuditAction.CREATE,
    resource: "testimonial",
    resourceId: testimonial.id,
    ...requestMeta(request),
    metadata: { action: "create_platform_testimonial", published: true },
  });

  return jsonNoStore({ testimonial });
}
