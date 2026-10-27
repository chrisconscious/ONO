import { ok } from "@/lib/api/tenant-route";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { approveTestimonial } from "@/server/services/testimonial-service";

export const dynamic = "force-dynamic";

/** Explicit, audited publication approval — the only publish path. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const admin = await requirePlatformAdmin();
  const { id } = await params;
  return ok(await approveTestimonial(id, admin.id));
}
