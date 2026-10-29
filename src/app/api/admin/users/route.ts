import type { NextRequest } from "next/server";
import { AuditAction, UserRole } from "@prisma/client";
import { z } from "zod";
import { jsonError, requestMeta, resolveApiActor } from "@/lib/auth/api";
import { prisma } from "@/lib/database/prisma";
import { createAuditLog } from "@/server/services/audit/audit.service";
import {
  createPlatformUser,
  listPlatformUsers,
} from "@/server/services/platform/users.service";

export async function GET(request: NextRequest) {
  const { response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? "25") || 25),
  );
  const roleParam = searchParams.get("role");
  const role =
    roleParam && roleParam in UserRole ? (roleParam as UserRole) : undefined;

  const result = await listPlatformUsers({
    q: searchParams.get("q") ?? undefined,
    role,
    page,
    pageSize,
  });

  return Response.json({
    ...result,
    pagination: { page, pageSize, total: result.total },
  });
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(12, "Use at least 12 characters."),
});

export async function POST(request: NextRequest) {
  const { actor, response } = await resolveApiActor({ platformAdmin: true });
  if (response) return jsonError(response.status, response.body.error);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, "Check the administrator details.", parsed.error.issues);
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError(409, "An account with that email already exists.");
  }

  const user = await createPlatformUser({
    email,
    name: parsed.data.name,
    password: parsed.data.password,
    role: UserRole.PLATFORM_ADMIN,
  });

  await createAuditLog({
    userId: actor.id,
    action: AuditAction.CREATE,
    resource: "platform_administrator",
    resourceId: user.id,
    ...requestMeta(request),
    metadata: { email: user.email },
  });

  return Response.json({ user }, { status: 201 });
}
