import { requireTenantApi } from "@/lib/api/tenant";
import { listOwnTestimonials } from "@/server/services/testimonials/testimonials.service";

/** The authenticated member's own submissions and their current status. */
export async function GET() {
  const result = await requireTenantApi("PERM-TESTIMONIAL.READ");
  if (result.error) return result.error;

  const testimonials = await listOwnTestimonials({
    tenantId: result.tenantId,
    userId: result.actor.id,
  });

  return Response.json({ testimonials });
}
