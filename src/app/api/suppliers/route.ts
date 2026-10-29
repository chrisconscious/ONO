import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { getActorContext } from "@/lib/permissions/authorize";

const createSupplierSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await getActorContext(session.user.id);
    if (!actor.tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

    const suppliers = await prisma.supplier.findMany({
      where: { tenantId: actor.tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("Get suppliers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await getActorContext(session.user.id);
    if (!actor.tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

    const body = await request.json();
    const data = createSupplierSchema.parse(body);

    const supplier = await prisma.supplier.create({
      data: {
        tenantId: actor.tenantId,
        name: data.name,
        email: data.email || null,
        phone: data.phone,
      },
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
    }
    console.error("Create supplier error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
