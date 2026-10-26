import type { Prisma } from "@prisma/client";

/**
 * Tenant-scoped sequential document numbering.
 * Uses a counter row keyed by (tenantId, prefix) with an atomic upsert+increment
 * so concurrent issuances never produce duplicate numbers.
 */
export async function nextNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
  prefix: string,
): Promise<string> {
  const counter = await tx.documentCounter.upsert({
    where: { tenantId_prefix: { tenantId, prefix } },
    create: { tenantId, prefix, seq: 1 },
    update: { seq: { increment: 1 } },
  });
  return `${prefix}-${String(counter.seq).padStart(5, "0")}`;
}
