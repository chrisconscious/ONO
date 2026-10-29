import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { getActorContext } from "@/lib/permissions/authorize";

const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  tenantId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await getActorContext(session.user.id);
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || actor.tenantId;

    const where = tenantId ? { tenantId } : {};
    const roles = await prisma.role.findMany({
      where,
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Get roles error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "PLATFORM_ADMIN" && session.user.role !== "TENANT_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const actor = await getActorContext(session.user.id);
    const body = await request.json();
    const data = createRoleSchema.parse(body);

    const tenantId = data.tenantId || actor.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

    const role = await prisma.role.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        isSystem: false,
      },
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
    }
    console.error("Create role error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
