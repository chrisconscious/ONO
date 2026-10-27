import { ok } from "@/lib/api/tenant-route";
import { listPublishedTestimonials } from "@/server/services/testimonial-service";

export const dynamic = "force-dynamic";

/**
 * Public carousel feed for the authentication page. Unauthenticated access is
 * intentional and safe: only explicitly approved rows are returned, with a
 * field whitelist that excludes all moderation metadata.
 */
export async function GET(): Promise<Response> {
  return ok(await listPublishedTestimonials());
}
