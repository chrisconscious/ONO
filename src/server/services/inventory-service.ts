import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "@/server/services/audit-service";
import { nextNumber } from "@/server/services/numbering";
import type { TenantContext } from "@/lib/auth/session";
import { Prisma, type PurchaseOrderStatus } from "@prisma/client";
import {
  createProductSchema,
  createPurchaseOrderSchema,
  createSupplierSchema,
  createWarehouseSchema,
  stockMovementSchema,
} from "@/lib/validation/schemas";

// ---------------------------------------------------------------------------
// Products / warehouses / suppliers (master data)
// ---------------------------------------------------------------------------

export async function createProduct(input: unknown, ctx: TenantContext) {
  const data = createProductSchema.parse(input);
  const existing = await prisma.product.findFirst({
    where: { tenantId: ctx.tenantId, sku: data.sku },
  });
  if (existing) throw ApiError.conflict(`SKU '${data.sku}' already exists in this organization`);
  const product = await prisma.product.create({
    data: {
      tenantId: ctx.tenantId,
      sku: data.sku,
      name: data.name,
      description: data.description,
      type: data.type,
      unitPrice: new Prisma.Decimal(data.unitPrice),
      costPrice: data.costPrice !== undefined ? new Prisma.Decimal(data.costPrice) : undefined,
      taxRate: data.taxRate !== undefined ? new Prisma.Decimal(data.taxRate) : undefined,
      reorderPoint: data.reorderPoint,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "inventory.product.create",
    entityType: "Product",
    entityId: product.id,
    summary: `Product ${product.sku} created`,
  });
  return product;
}

export async function listProducts(query: { search?: string }, ctx: TenantContext) {
  const search = query.search?.trim();
  return prisma.product.findMany({
    where: {
      tenantId: ctx.tenantId,
      ...(search ? { OR: [{ sku: { contains: search } }, { name: { contains: search } }] } : {}),
    },
    orderBy: { sku: "asc" },
    take: 200,
  });
}

export async function createWarehouse(input: unknown, ctx: TenantContext) {
  const data = createWarehouseSchema.parse(input);
  const dup = await prisma.warehouse.findFirst({ where: { tenantId: ctx.tenantId, code: data.code } });
  if (dup) throw ApiError.conflict(`Warehouse code '${data.code}' already exists`);
  const warehouse = await prisma.$transaction(async (tx) => {
    if (data.isPrimary) {
      await tx.warehouse.updateMany({ where: { tenantId: ctx.tenantId }, data: { isPrimary: false } });
    }
    return tx.warehouse.create({
      data: {
        tenantId: ctx.tenantId,
        name: data.name,
        code: data.code,
        location: data.location,
        branchId: data.branchId,
        isPrimary: data.isPrimary,
      },
    });
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "inventory.warehouse.create",
    entityType: "Warehouse",
    entityId: warehouse.id,
    summary: `Warehouse ${warehouse.code} created`,
  });
  return warehouse;
}

export async function createSupplier(input: unknown, ctx: TenantContext) {
  const data = createSupplierSchema.parse(input);
  const dup = await prisma.supplier.findFirst({ where: { tenantId: ctx.tenantId, name: data.name } });
  if (dup) throw ApiError.conflict("A supplier with this name already exists");
  const supplier = await prisma.supplier.create({
    data: {
      tenantId: ctx.tenantId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      terms: data.terms,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "purchasing.supplier.create",
    entityType: "Supplier",
    entityId: supplier.id,
    summary: `Supplier ${supplier.name} created`,
  });
  return supplier;
}

// ---------------------------------------------------------------------------
// Stock movements — balance and history always updated in one transaction.
// ---------------------------------------------------------------------------

export async function recordStockMovement(input: unknown, ctx: TenantContext) {
  const data = stockMovementSchema.parse(input);

  const [product, warehouse] = await Promise.all([
    prisma.product.findFirst({ where: { id: data.productId, tenantId: ctx.tenantId } }),
    prisma.warehouse.findFirst({ where: { id: data.warehouseId, tenantId: ctx.tenantId } }),
  ]);
  if (!product) throw ApiError.validation("productId does not belong to this organization");
  if (!warehouse) throw ApiError.validation("warehouseId does not belong to this organization");
  if (product.type !== "GOODS") throw ApiError.validation("Services cannot have stock movements");
  if (data.type === "ADJUSTMENT" && !data.reason) {
    throw ApiError.validation("Adjustments require a reason for the audit trail");
  }

  const delta = new Prisma.Decimal(data.quantity);

  const result = await prisma.$transaction(async (tx) => {
    // Lock-then-check pattern: re-read balance inside the transaction so two
    // concurrent withdrawals can't both pass the availability check.
    const item = await tx.stockItem.upsert({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
      create: { tenantId: ctx.tenantId, productId: product.id, warehouseId: warehouse.id, quantity: new Prisma.Decimal(0) },
      update: {},
    });
    const balanceBefore = item.quantity;
    const balanceAfter = balanceBefore.add(delta);
    if (balanceAfter.lt(0)) {
      throw ApiError.conflict(
        `Movement would make stock negative for SKU ${product.sku}: balance ${balanceBefore.toString()}, delta ${delta.toString()}`,
      );
    }
    const updatedItem = await tx.stockItem.update({
      where: { id: item.id },
      data: { quantity: balanceAfter },
    });
    const movement = await tx.stockMovement.create({
      data: {
        tenantId: ctx.tenantId,
        productId: product.id,
        warehouseId: warehouse.id,
        type: data.type,
        quantity: delta,
        reference: data.reference,
        reason: data.reason ?? (data.type === "ADJUSTMENT" ? "Manual adjustment" : null),
      },
    });
    return { movement, item: updatedItem, balanceBefore, balanceAfter };
  });

  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "inventory.stock.move",
    entityType: "StockMovement",
    entityId: result.movement.id,
    summary: `${data.type} ${delta.toString()} of ${product.sku} @ ${warehouse.code}; balance ${result.balanceBefore} -> ${result.balanceAfter}`,
  });
  return result.movement;
}

export async function getStockLevel(productId: string, warehouseId: string, ctx: TenantContext) {
  const item = await prisma.stockItem.findFirst({
    where: { tenantId: ctx.tenantId, productId, warehouseId },
  });
  return { productId, warehouseId, quantity: item?.quantity ?? new Prisma.Decimal(0) };
}

// ---------------------------------------------------------------------------
// Purchase orders — DRAFT -> ORDERED -> (PARTIAL|RECEIVED). Goods receipt
// increases stock atomically and records movements.
// ---------------------------------------------------------------------------

interface POLine {
  productId: string;
  description: string;
  quantity: number;
  unitCost: string;
}

export async function createPurchaseOrder(input: unknown, ctx: TenantContext) {
  const data = createPurchaseOrderSchema.parse(input);
  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, tenantId: ctx.tenantId },
  });
  if (!supplier) throw ApiError.validation("supplierId does not belong to this organization");
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: data.warehouseId, tenantId: ctx.tenantId },
  });
  if (!warehouse) throw ApiError.validation("warehouseId does not belong to this organization");
  for (const line of data.lines) {
    const p = await prisma.product.findFirst({ where: { id: line.productId, tenantId: ctx.tenantId } });
    if (!p) throw ApiError.validation(`Product ${line.productId} not found in this organization`);
  }

  const normalizedLines: POLine[] = data.lines.map((l) => ({
    productId: l.productId,
    description: l.description,
    quantity: l.quantity,
    unitCost: new Prisma.Decimal(l.unitCost).toFixed(2),
  }));
  const total = normalizedLines.reduce(
    (s, l) => s.add(new Prisma.Decimal(l.unitCost).mul(new Prisma.Decimal(l.quantity))),
    new Prisma.Decimal(0),
  );

  const po = await prisma.$transaction(async (tx) => {
    const number = await nextNumber(tx, ctx.tenantId, "PO");
    return tx.purchaseOrder.create({
      data: {
        tenantId: ctx.tenantId,
        number,
        supplierId: supplier.id,
        warehouseId: warehouse.id,
        lines: normalizedLines as unknown as Prisma.InputJsonValue,
        total,
        expectedDate: data.expectedDate,
      },
    });
  });

  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "purchasing.order.create",
    entityType: "PurchaseOrder",
    entityId: po.id,
    summary: `Purchase order ${po.number} created for ${supplier.name} (${total.toFixed(2)})`,
  });
  return po;
}

const PO_EDGES: Record<PurchaseOrderStatus, readonly PurchaseOrderStatus[]> = {
  DRAFT: ["ORDERED", "CANCELLED"],
  ORDERED: ["RECEIVED", "CANCELLED"],
  PARTIAL: ["RECEIVED", "CANCELLED"],
  RECEIVED: [],
  CANCELLED: [],
};

export async function transitionPurchaseOrder(
  poId: string,
  to: PurchaseOrderStatus,
  ctx: TenantContext,
) {
  const po = await prisma.purchaseOrder.findFirst({ where: { id: poId, tenantId: ctx.tenantId } });
  if (!po) throw ApiError.notFound("Purchase order not found");
  if (!PO_EDGES[po.status].includes(to)) {
    throw ApiError.validation(`Illegal purchase order transition: ${po.status} -> ${to}`);
  }
  if (to === "RECEIVED") return receivePurchaseOrder(po, ctx);
  const updated = await prisma.purchaseOrder.update({ where: { id: po.id }, data: { status: to } });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "purchasing.order.status_change",
    entityType: "PurchaseOrder",
    entityId: po.id,
    summary: `PO ${po.number}: ${po.status} -> ${to}`,
  });
  return updated;
}

/** Goods receipt: increase stock for every line and record movements atomically. */
async function receivePurchaseOrder(
  po: { id: string; number: string; tenantId: string; warehouseId: string; lines: unknown },
  ctx: TenantContext,
) {
  const lines = po.lines as unknown as POLine[];
  const updated = await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      const item = await tx.stockItem.upsert({
        where: { productId_warehouseId: { productId: line.productId, warehouseId: po.warehouseId } },
        create: {
          tenantId: po.tenantId,
          productId: line.productId,
          warehouseId: po.warehouseId,
          quantity: new Prisma.Decimal(line.quantity),
        },
        update: { quantity: { increment: new Prisma.Decimal(line.quantity) } },
      });
      void item;
      await tx.stockMovement.create({
        data: {
          tenantId: po.tenantId,
          productId: line.productId,
          warehouseId: po.warehouseId,
          type: "PURCHASE",
          quantity: new Prisma.Decimal(line.quantity),
          reference: po.number,
          reason: `Goods receipt for purchase order ${po.number}`,
        },
      });
    }
    return tx.purchaseOrder.update({
      where: { id: po.id },
      data: { status: "RECEIVED", receivedAt: new Date() },
    });
  });

  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "purchasing.order.received",
    entityType: "PurchaseOrder",
    entityId: po.id,
    summary: `Goods received against PO ${po.number}; stock increased`,
  });
  return updated;
}
