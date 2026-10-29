import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { getActorContext } from "@/lib/permissions/authorize";

const createPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().optional(),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await getActorContext(session.user.id);
    if (!actor.tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

    const payments = await prisma.payment.findMany({
      where: { tenantId: actor.tenantId },
      include: { invoice: true },
      orderBy: { paidAt: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Get payments error:", error);
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
    const data = createPaymentSchema.parse(body);

    const invoice = await prisma.invoice.findFirst({
      where: { id: data.invoiceId, tenantId: actor.tenantId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          tenantId: actor.tenantId!,
          invoiceId: data.invoiceId,
          amount: data.amount,
          currency: data.currency || "TZS",
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          notes: data.notes,
        },
      });

      const newAmountPaid = Number(invoice.amountPaid) + data.amount;
      const total = Number(invoice.total);
      const balance = total - newAmountPaid;
      let status = invoice.status;

      if (balance <= 0) {
        status = "PAID";
      } else if (newAmountPaid > 0) {
        status = "PARTIALLY_PAID";
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          balance: balance > 0 ? balance : 0,
          status,
        },
      });

      return p;
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
    }
    console.error("Create payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
