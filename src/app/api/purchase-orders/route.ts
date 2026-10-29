import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { getActorContext } from "@/lib/permissions/authorize";

const createPOSchema = z.object({
  supplierId: z.string().min(1),
  poNumber: z.string().min(1),
  status: z.string().optional(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number(),
  currency: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await getActorContext(session.user.id);
    if (!actor.tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { tenantId: actor.tenantId },
        include: { supplier: true, lines: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.purchaseOrder.count({ where: { tenantId: actor.tenantId } }),
    ]);

    return NextResponse.json({ purchaseOrders, total });
  } catch (error) {
    console.error("Get PO error:", error);
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
    const data = createPOSchema.parse(body);

    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId: actor.tenantId,
        supplierId: data.supplierId,
        poNumber: data.poNumber,
        status: data.status || "DRAFT",
        subtotal: data.subtotal || 0,
        tax: data.tax || 0,
        total: data.total,
        currency: data.currency || "TZS",
        notes: data.notes,
      },
    });

    return NextResponse.json({ purchaseOrder: po }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
    }
    console.error("Create PO error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
