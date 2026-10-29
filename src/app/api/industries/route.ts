import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { getActorContext } from "@/lib/permissions/authorize";

const createCustomIndustrySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeCustom = searchParams.get("includeCustom") === "true";

    const industries = await prisma.industry.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { name: "asc" },
      include: { children: true },
    });

    let customIndustries: Array<Record<string, unknown>> = [];
    if (includeCustom) {
      const session = await getSession();
      if (session) {
        const actor = await getActorContext(session.user.id);
        if (actor.tenantId) {
          customIndustries = await prisma.customIndustry.findMany({
            where: { tenantId: actor.tenantId },
            orderBy: { createdAt: "desc" },
          });
        }
      }
    }

    return NextResponse.json({ industries, customIndustries });
  } catch (error) {
    console.error("Get industries error:", error);
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
    const data = createCustomIndustrySchema.parse(body);

    const customIndustry = await prisma.customIndustry.create({
      data: {
        tenantId: actor.tenantId,
        name: data.name,
        description: data.description,
        status: "PENDING_REVIEW",
      },
    });

    return NextResponse.json({ customIndustry }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
    }
    console.error("Create custom industry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
