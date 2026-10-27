import { ok } from "@/lib/api/tenant-route";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { withdrawTestimonial } from "@/server/services/testimonial-service";

export const dynamic = "force-dynamic";

/** Immediately remove a testimonial from public display. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const admin = await requirePlatformAdmin();
  const { id } = await params;
  return ok(await withdrawTestimonial(id, admin.id));
}
