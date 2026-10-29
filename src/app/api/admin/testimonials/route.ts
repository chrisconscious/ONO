import type { NextRequest } from "next/server";
import { TestimonialStatus } from "@prisma/client";
import { jsonError, resolveApiActor } from "@/lib/auth/api";
import {
  countTestimonialsByStatus,
  listTestimonialsForModeration,
} from "@/server/services/testimonials/testimonials.service";

const statuses = new Set(Object.values(TestimonialStatus));

/**
 * Lists testimonials for platform moderation with the filters supported by the
 * stored data: status, tenant, rating, submission date and free text.
 */
export async function GET(request: NextRequest) {
  const { response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const { searchParams } = new URL(request.url);

  const statusParam = searchParams.get("status");
  const ratingParam = Number(searchParams.get("rating"));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize")) || 20));

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const filters = {
    status:
      statusParam && statuses.has(statusParam as TestimonialStatus)
        ? (statusParam as TestimonialStatus)
        : undefined,
    tenantId: searchParams.get("tenantId") || undefined,
    rating:
      Number.isInteger(ratingParam) && ratingParam >= 1 && ratingParam <= 5
        ? ratingParam
        : undefined,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    q: searchParams.get("q")?.trim() || undefined,
    page,
    pageSize,
  };

  try {
    const [result, counts] = await Promise.all([
      listTestimonialsForModeration(filters),
      countTestimonialsByStatus(),
    ]);

    return Response.json({
      testimonials: result.testimonials,
      counts,
      pagination: {
        page,
        pageSize,
        total: result.total,
        pages: Math.max(1, Math.ceil(result.total / pageSize)),
      },
    });
  } catch (error) {
    console.error("Moderation list error:", error);
    return jsonError(500, "Unable to load testimonials.");
  }
}
