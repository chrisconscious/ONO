import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { ok, readJsonBody } from "@/lib/api/tenant-route";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { createTestimonial, listAllTestimonials } from "@/server/services/testimonial-service";

export const dynamic = "force-dynamic";

/** Moderation list — platform admins only, includes unpublished drafts. */
export async function GET(): Promise<Response> {
  await requirePlatformAdmin();
  return ok(await listAllTestimonials());
}

/** Create a testimonial draft. New content is never auto-published. */
export async function POST(request: NextRequest): Promise<Response> {
  const admin = await requirePlatformAdmin();
  const body = await readJsonBody(request);
  if (body === null) throw ApiError.validation("Request body must be valid JSON");
  return ok(await createTestimonial(body, admin.id), 201);
}
