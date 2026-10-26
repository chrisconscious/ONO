/**
 * Cross-department handover ledger for idempotent multi-step workflows.
 * Prevents duplicate deliveries, projects, invoices when events are retried.
 */

import { prisma } from "@/lib/database/prisma";
import type { TenantContext } from "@/lib/auth/session";
import type { HandoverKind } from "@prisma/client";

export interface HandoverArgs {
  kind: HandoverKind; // e.g., ORDER_INVOICE, ORDER_DELIVERY, OPPORTUNITY_PROJECT
  sourceType: string; // e.g., "SalesOrder", "Opportunity"
  sourceId: string;
  targetId: string; // The record created by the handover
  idempotencyKey: string; // Unique key to prevent duplicates on retry
}

/**
 * Records a handover event in the ledger with idempotency protection.
 * If a handover with the same idempotencyKey already exists, returns the existing record.
 */
export async function recordHandover(
  ctx: TenantContext,
  args: HandoverArgs,
): Promise<{ id: string; created: boolean }> {
  try {
    const result = await prisma.handover.create({
      data: {
        tenantId: ctx.tenantId,
        kind: args.kind,
        sourceType: args.sourceType,
        sourceId: args.sourceId,
        targetId: args.targetId,
        idempotencyKey: args.idempotencyKey,
        createdBy: ctx.user.id,
      },
    });
    return { id: result.id, created: true };
  } catch (error: unknown) {
    // Handle unique constraint violation - idempotent case
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      const existing = await prisma.handover.findUnique({
        where: { idempotencyKey: args.idempotencyKey },
      });
      if (existing) {
        return { id: existing.id, created: false };
      }
    }
    throw error;
  }
}

/**
 * Checks if a handover has already been processed for the given idempotency key.
 */
export async function isHandoverProcessed(idempotencyKey: string): Promise<boolean> {
  const existing = await prisma.handover.findUnique({
    where: { idempotencyKey },
  });
  return existing !== null;
}
