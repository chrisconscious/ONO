import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import type { Prisma } from "@prisma/client";
import {
  DOCUMENTS,
  isDocumentKey,
  type DocumentKey,
} from "@/lib/resources/documents";

export type DocumentLineRow = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productId: string | null;
  productName: string | null;
};

export type DocumentDetail = {
  id: string;
  key: DocumentKey;
  number: string;
  status: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number | null;
  balance: number | null;
  createdAt: string;
  updatedAt: string;
  validUntil: string | null;
  orderDate: string | null;
  expectedDate: string | null;
  issueDate: string | null;
  dueDate: string | null;
  partyLabel: string | null;
  partyName: string | null;
  lines: DocumentLineRow[];
};

const lineInputSchema = z.object({
  description: z.string().trim().min(1, "A description is required.").max(300),
  quantity: z
    .number()
    .positive("Quantity must be greater than zero.")
    .max(1_000_000),
  unitPrice: z
    .number()
    .min(0, "Unit price cannot be negative.")
    .max(1_000_000_000),
  productId: z.string().trim().max(40).nullish(),
});

export type DocumentLineInput = z.infer<typeof lineInputSchema>;

const lineIdSchema = z.string().trim().min(1);

/** Raised when a line change would break an already-posted financial record. */
class DocumentLineError extends Error {}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sumLines(lines: Array<{ total: Prisma.Decimal | number }>) {
  return round2(lines.reduce((sum, line) => sum + Number(line.total), 0));
}

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

async function assertDocument(key: DocumentKey, tenantId: string, id: string) {
  switch (key) {
    case "quotations":
      return prisma.quotation.findFirst({
        where: { id, tenantId },
        select: { id: true },
      });
    case "sales-orders":
      return prisma.salesOrder.findFirst({
        where: { id, tenantId },
        select: { id: true },
      });
    case "purchase-orders":
      return prisma.purchaseOrder.findFirst({
        where: { id, tenantId },
        select: { id: true },
      });
    case "invoices":
      return prisma.invoice.findFirst({
        where: { id, tenantId },
        select: { id: true },
      });
  }
}

/** Loads one document and its lines, scoped to the active tenant. */
export async function getDocument(
  key: DocumentKey,
  tenantId: string,
  id: string,
): Promise<DocumentDetail | null> {
  switch (key) {
    case "quotations": {
      const doc = await prisma.quotation.findFirst({
        where: { id, tenantId },
        include: {
          opportunity: { select: { name: true } },
          lines: {
            orderBy: { createdAt: "asc" },
            include: { product: { select: { name: true } } },
          },
        },
      });
      if (!doc) return null;

      return {
        id: doc.id,
        key,
        number: doc.quoteNumber,
        status: doc.status,
        currency: doc.currency,
        subtotal: Number(doc.subtotal),
        tax: Number(doc.tax),
        total: Number(doc.total),
        amountPaid: null,
        balance: null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        validUntil: iso(doc.validUntil),
        orderDate: null,
        expectedDate: null,
        issueDate: null,
        dueDate: null,
        partyLabel: doc.opportunity ? "Opportunity" : null,
        partyName: doc.opportunity?.name ?? null,
        lines: doc.lines.map((line) => ({
          id: line.id,
          description: line.description,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          total: Number(line.total),
          productId: line.productId,
          productName: line.product?.name ?? null,
        })),
      };
    }

    case "sales-orders": {
      const doc = await prisma.salesOrder.findFirst({
        where: { id, tenantId },
        include: {
          quotation: { select: { quoteNumber: true } },
          lines: {
            orderBy: { createdAt: "asc" },
            include: { product: { select: { name: true } } },
          },
        },
      });
      if (!doc) return null;

      return {
        id: doc.id,
        key,
        number: doc.orderNumber,
        status: doc.status,
        currency: doc.currency,
        subtotal: Number(doc.subtotal),
        tax: Number(doc.tax),
        total: Number(doc.total),
        amountPaid: null,
        balance: null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        validUntil: null,
        orderDate: doc.orderDate.toISOString(),
        expectedDate: null,
        issueDate: null,
        dueDate: null,
        partyLabel: doc.quotation ? "Quotation" : null,
        partyName: doc.quotation?.quoteNumber ?? null,
        lines: doc.lines.map((line) => ({
          id: line.id,
          description: line.description,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          total: Number(line.total),
          productId: line.productId,
          productName: line.product?.name ?? null,
        })),
      };
    }

    case "purchase-orders": {
      const doc = await prisma.purchaseOrder.findFirst({
        where: { id, tenantId },
        include: {
          supplier: { select: { name: true } },
          lines: {
            orderBy: { createdAt: "asc" },
            include: { product: { select: { name: true } } },
          },
        },
      });
      if (!doc) return null;

      return {
        id: doc.id,
        key,
        number: doc.poNumber,
        status: doc.status,
        currency: doc.currency,
        subtotal: Number(doc.subtotal),
        tax: Number(doc.tax),
        total: Number(doc.total),
        amountPaid: null,
        balance: null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        validUntil: null,
        orderDate: doc.orderDate.toISOString(),
        expectedDate: iso(doc.expectedDate),
        issueDate: null,
        dueDate: null,
        partyLabel: "Supplier",
        partyName: doc.supplier.name,
        lines: doc.lines.map((line) => ({
          id: line.id,
          description: line.description,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          total: Number(line.total),
          productId: line.productId,
          productName: line.product?.name ?? null,
        })),
      };
    }

    case "invoices": {
      const doc = await prisma.invoice.findFirst({
        where: { id, tenantId },
        include: {
          salesOrder: { select: { orderNumber: true } },
          lines: { orderBy: { createdAt: "asc" } },
        },
      });
      if (!doc) return null;

      return {
        id: doc.id,
        key,
        number: doc.invoiceNumber,
        status: doc.status,
        currency: doc.currency,
        subtotal: Number(doc.subtotal),
        tax: Number(doc.tax),
        total: Number(doc.total),
        amountPaid: Number(doc.amountPaid),
        balance: Number(doc.balance),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        validUntil: null,
        orderDate: null,
        expectedDate: null,
        issueDate: doc.issueDate.toISOString(),
        dueDate: iso(doc.dueDate),
        partyLabel: doc.salesOrder ? "Sales order" : null,
        partyName: doc.salesOrder?.orderNumber ?? null,
        lines: doc.lines.map((line) => ({
          id: line.id,
          description: line.description,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          total: Number(line.total),
          productId: null,
          productName: null,
        })),
      };
    }
  }
}

/**
 * Recalculates document totals from its lines. Tax stays a document-level
 * amount; subtotal and total are always derived on the server so a client can
 * never write an inconsistent total.
 */
async function recalculateTotals(
  tx: Prisma.TransactionClient,
  key: DocumentKey,
  documentId: string,
) {
  switch (key) {
    case "quotations": {
      const [lines, doc] = await Promise.all([
        tx.quotationLine.findMany({
          where: { quotationId: documentId },
          select: { total: true },
        }),
        tx.quotation.findUniqueOrThrow({
          where: { id: documentId },
          select: { tax: true },
        }),
      ]);
      const subtotal = sumLines(lines);
      const total = round2(subtotal + Number(doc.tax));
      await tx.quotation.update({
        where: { id: documentId },
        data: { subtotal, total },
      });
      return;
    }

    case "sales-orders": {
      const [lines, doc] = await Promise.all([
        tx.salesOrderLine.findMany({
          where: { salesOrderId: documentId },
          select: { total: true },
        }),
        tx.salesOrder.findUniqueOrThrow({
          where: { id: documentId },
          select: { tax: true },
        }),
      ]);
      const subtotal = sumLines(lines);
      const total = round2(subtotal + Number(doc.tax));
      await tx.salesOrder.update({
        where: { id: documentId },
        data: { subtotal, total },
      });
      return;
    }

    case "purchase-orders": {
      const [lines, doc] = await Promise.all([
        tx.purchaseOrderLine.findMany({
          where: { purchaseOrderId: documentId },
          select: { total: true },
        }),
        tx.purchaseOrder.findUniqueOrThrow({
          where: { id: documentId },
          select: { tax: true },
        }),
      ]);
      const subtotal = sumLines(lines);
      const total = round2(subtotal + Number(doc.tax));
      await tx.purchaseOrder.update({
        where: { id: documentId },
        data: { subtotal, total },
      });
      return;
    }

    case "invoices": {
      const [lines, doc] = await Promise.all([
        tx.invoiceLine.findMany({
          where: { invoiceId: documentId },
          select: { total: true },
        }),
        tx.invoice.findUniqueOrThrow({
          where: { id: documentId },
          select: { tax: true, amountPaid: true, status: true },
        }),
      ]);
      const subtotal = sumLines(lines);
      const total = round2(subtotal + Number(doc.tax));
      const amountPaid = Number(doc.amountPaid);

      if (total < amountPaid) {
        throw new DocumentLineError(
          "The invoice total cannot be lower than payments already recorded.",
        );
      }

      const balance = round2(total - amountPaid);
      const posted = doc.status === "VOID" || doc.status === "WRITTEN_OFF";
      const status = posted
        ? doc.status
        : balance <= 0 && total > 0
          ? "PAID"
          : amountPaid > 0
            ? "PARTIALLY_PAID"
            : doc.status;

      await tx.invoice.update({
        where: { id: documentId },
        data: { subtotal, total, balance, status },
      });
      return;
    }
  }
}

async function resolveProduct(
  tx: Prisma.TransactionClient,
  tenantId: string,
  key: DocumentKey,
  productId: string | null | undefined,
) {
  if (!DOCUMENTS[key].supportsProduct) return null;
  if (!productId) return null;

  const product = await tx.product.findFirst({
    where: { id: productId, tenantId },
    select: { id: true },
  });
  if (!product) throw new DocumentLineError("Product not found in this workspace.");
  return product.id;
}

export type DocumentMutationResult =
  | { detail: DocumentDetail }
  | { error: string };

/** Adds a line and recalculates totals inside one transaction. */
export async function addDocumentLine(params: {
  key: DocumentKey;
  tenantId: string;
  documentId: string;
  input: unknown;
}): Promise<DocumentMutationResult> {
  const { key, tenantId, documentId, input } = params;
  if (!isDocumentKey(key)) return { error: "Unknown document type." };

  const owned = await assertDocument(key, tenantId, documentId);
  if (!owned) return { error: "Document not found in this workspace." };

  const parsed = lineInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid line." };
  }

  const data = parsed.data;
  const lineTotal = round2(data.quantity * data.unitPrice);

  try {
    await prisma.$transaction(async (tx) => {
      const productId = await resolveProduct(tx, tenantId, key, data.productId);

      switch (key) {
        case "quotations":
          await tx.quotationLine.create({
            data: {
              quotationId: documentId,
              productId,
              description: data.description,
              quantity: data.quantity,
              unitPrice: data.unitPrice,
              total: lineTotal,
            },
          });
          break;
        case "sales-orders":
          await tx.salesOrderLine.create({
            data: {
              salesOrderId: documentId,
              productId,
              description: data.description,
              quantity: data.quantity,
              unitPrice: data.unitPrice,
              total: lineTotal,
            },
          });
          break;
        case "purchase-orders":
          await tx.purchaseOrderLine.create({
            data: {
              purchaseOrderId: documentId,
              productId,
              description: data.description,
              quantity: data.quantity,
              unitPrice: data.unitPrice,
              total: lineTotal,
            },
          });
          break;
        case "invoices":
          await tx.invoiceLine.create({
            data: {
              invoiceId: documentId,
              description: data.description,
              quantity: data.quantity,
              unitPrice: data.unitPrice,
              total: lineTotal,
            },
          });
          break;
      }

      await recalculateTotals(tx, key, documentId);
    });
  } catch (error) {
    if (error instanceof DocumentLineError) return { error: error.message };
    throw error;
  }

  const detail = await getDocument(key, tenantId, documentId);
  return detail
    ? { detail }
    : { error: "Document not found in this workspace." };
}

/** Updates one line, re-checks ownership, then recalculates totals. */
export async function updateDocumentLine(params: {
  key: DocumentKey;
  tenantId: string;
  documentId: string;
  lineId: string;
  input: unknown;
}): Promise<DocumentMutationResult> {
  const { key, tenantId, documentId, lineId, input } = params;
  if (!isDocumentKey(key)) return { error: "Unknown document type." };

  const owned = await assertDocument(key, tenantId, documentId);
  if (!owned) return { error: "Document not found in this workspace." };

  if (!lineIdSchema.safeParse(lineId).success) {
    return { error: "Line not found on this document." };
  }

  const parsed = lineInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid line." };
  }

  const data = parsed.data;
  const lineTotal = round2(data.quantity * data.unitPrice);

  try {
    await prisma.$transaction(async (tx) => {
      const productId = await resolveProduct(tx, tenantId, key, data.productId);

      switch (key) {
        case "quotations": {
          const existing = await tx.quotationLine.findFirst({
            where: { id: lineId, quotationId: documentId },
            select: { id: true },
          });
          if (!existing) throw new DocumentLineError("Line not found on this document.");
          await tx.quotationLine.update({
            where: { id: lineId },
            data: {
              productId,
              description: data.description,
              quantity: data.quantity,
              unitPrice: data.unitPrice,
              total: lineTotal,
            },
          });
          break;
        }
        case "sales-orders": {
          const existing = await tx.salesOrderLine.findFirst({
            where: { id: lineId, salesOrderId: documentId },
            select: { id: true },
          });
          if (!existing) throw new DocumentLineError("Line not found on this document.");
          await tx.salesOrderLine.update({
            where: { id: lineId },
            data: {
              productId,
              description: data.description,
              quantity: data.quantity,
              unitPrice: data.unitPrice,
              total: lineTotal,
            },
          });
          break;
        }
        case "purchase-orders": {
          const existing = await tx.purchaseOrderLine.findFirst({
            where: { id: lineId, purchaseOrderId: documentId },
            select: { id: true },
          });
          if (!existing) throw new DocumentLineError("Line not found on this document.");
          await tx.purchaseOrderLine.update({
            where: { id: lineId },
            data: {
              productId,
              description: data.description,
              quantity: data.quantity,
              unitPrice: data.unitPrice,
              total: lineTotal,
            },
          });
          break;
        }
        case "invoices": {
          const existing = await tx.invoiceLine.findFirst({
            where: { id: lineId, invoiceId: documentId },
            select: { id: true },
          });
          if (!existing) throw new DocumentLineError("Line not found on this document.");
          await tx.invoiceLine.update({
            where: { id: lineId },
            data: {
              description: data.description,
              quantity: data.quantity,
              unitPrice: data.unitPrice,
              total: lineTotal,
            },
          });
          break;
        }
      }

      await recalculateTotals(tx, key, documentId);
    });
  } catch (error) {
    if (error instanceof DocumentLineError) return { error: error.message };
    throw error;
  }

  const detail = await getDocument(key, tenantId, documentId);
  return detail
    ? { detail }
    : { error: "Document not found in this workspace." };
}

/** Deletes one line and recalculates the parent totals. */
export async function deleteDocumentLine(params: {
  key: DocumentKey;
  tenantId: string;
  documentId: string;
  lineId: string;
}): Promise<DocumentMutationResult> {
  const { key, tenantId, documentId, lineId } = params;
  if (!isDocumentKey(key)) return { error: "Unknown document type." };

  const owned = await assertDocument(key, tenantId, documentId);
  if (!owned) return { error: "Document not found in this workspace." };

  try {
    await prisma.$transaction(async (tx) => {
      switch (key) {
        case "quotations": {
          const existing = await tx.quotationLine.findFirst({
            where: { id: lineId, quotationId: documentId },
            select: { id: true },
          });
          if (!existing) throw new DocumentLineError("Line not found on this document.");
          await tx.quotationLine.delete({ where: { id: lineId } });
          break;
        }
        case "sales-orders": {
          const existing = await tx.salesOrderLine.findFirst({
            where: { id: lineId, salesOrderId: documentId },
            select: { id: true },
          });
          if (!existing) throw new DocumentLineError("Line not found on this document.");
          await tx.salesOrderLine.delete({ where: { id: lineId } });
          break;
        }
        case "purchase-orders": {
          const existing = await tx.purchaseOrderLine.findFirst({
            where: { id: lineId, purchaseOrderId: documentId },
            select: { id: true },
          });
          if (!existing) throw new DocumentLineError("Line not found on this document.");
          await tx.purchaseOrderLine.delete({ where: { id: lineId } });
          break;
        }
        case "invoices": {
          const existing = await tx.invoiceLine.findFirst({
            where: { id: lineId, invoiceId: documentId },
            select: { id: true },
          });
          if (!existing) throw new DocumentLineError("Line not found on this document.");
          await tx.invoiceLine.delete({ where: { id: lineId } });
          break;
        }
      }

      await recalculateTotals(tx, key, documentId);
    });
  } catch (error) {
    if (error instanceof DocumentLineError) return { error: error.message };
    throw error;
  }

  const detail = await getDocument(key, tenantId, documentId);
  return detail
    ? { detail }
    : { error: "Document not found in this workspace." };
}
