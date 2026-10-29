import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { getActorContext } from "@/lib/permissions/authorize";

const createMembershipSchema = z.object({
  userId: z.string().min(1),
  tenantId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await getActorContext(session.user.id);
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || actor.tenantId;

    if (!tenantId && session.user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "No tenant context" }, { status: 400 });
    }

    const where = tenantId ? { tenantId } : {};
    if (session.user.role !== "PLATFORM_ADMIN" && actor.tenantId && tenantId !== actor.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const memberships = await prisma.membership.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        tenant: true,
        roleAssignments: { include: { role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ memberships });
  } catch (error) {
    console.error("Get memberships error:", error);
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

    const body = await request.json();
    const data = createMembershipSchema.parse(body);

    const existing = await prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId: data.tenantId, userId: data.userId } },
    });

    if (existing) {
      return NextResponse.json({ error: "Membership already exists" }, { status: 409 });
    }

    const membership = await prisma.membership.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
    }
    console.error("Create membership error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
