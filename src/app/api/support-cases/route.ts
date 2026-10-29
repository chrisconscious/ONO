import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { getActorContext } from "@/lib/permissions/authorize";

const createCaseSchema = z.object({
  subject: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await getActorContext(session.user.id);
    if (!actor.tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

    const cases = await prisma.supportCase.findMany({
      where: { tenantId: actor.tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ cases });
  } catch (error) {
    console.error("Get support cases error:", error);
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
    const data = createCaseSchema.parse(body);

    const supportCase = await prisma.supportCase.create({
      data: {
        tenantId: actor.tenantId,
        subject: data.subject,
        description: data.description,
        status: data.status || "OPEN",
        priority: data.priority || "MEDIUM",
        assignedTo: data.assignedTo,
      },
    });

    return NextResponse.json({ supportCase }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
    }
    console.error("Create support case error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
