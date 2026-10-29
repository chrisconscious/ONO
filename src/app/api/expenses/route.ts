import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { getActorContext } from "@/lib/permissions/authorize";

const createExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().optional(),
  category: z.string().optional(),
  vendor: z.string().optional(),
  expenseDate: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await getActorContext(session.user.id);
    if (!actor.tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: { tenantId: actor.tenantId },
        orderBy: { expenseDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where: { tenantId: actor.tenantId } }),
    ]);

    return NextResponse.json({ expenses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Get expenses error:", error);
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
    const data = createExpenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        tenantId: actor.tenantId,
        description: data.description,
        amount: data.amount,
        currency: data.currency || "TZS",
        category: data.category,
        vendor: data.vendor,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
        status: data.status || "PENDING",
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
    }
    console.error("Create expense error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
