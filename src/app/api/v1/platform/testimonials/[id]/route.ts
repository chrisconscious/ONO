import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { ok, readJsonBody } from "@/lib/api/tenant-route";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { deleteTestimonial, updateTestimonial } from "@/server/services/testimonial-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** Partial content update; publication state is not modifiable here. */
export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const admin = await requirePlatformAdmin();
  const { id } = await params;
  const body = await readJsonBody(request);
  if (body === null) throw ApiError.validation("Request body must be valid JSON");
  return ok(await updateTestimonial(id, body, admin.id));
}

/** Delete an unpublished draft (published items must be withdrawn first). */
export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  const admin = await requirePlatformAdmin();
  const { id } = await params;
  await deleteTestimonial(id, admin.id);
  return ok({ deleted: true });
}
