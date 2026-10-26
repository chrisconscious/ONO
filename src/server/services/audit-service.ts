import { prisma } from "@/lib/database/prisma";
import type { AuditSeverity } from "@prisma/client";

export interface AuditEventInput {
  tenantId?: string | null;
  userId?: string | null;
  membershipId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  severity?: AuditSeverity;
  summary: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

/**
 * Append-only audit trail. Failures to write an audit record must never
 * break the business operation itself, but are surfaced in logs.
 */
export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId ?? null,
        userId: input.userId ?? null,
        membershipId: input.membershipId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        severity: input.severity ?? "INFO",
        summary: input.summary,
        metadata: input.metadata as object | undefined,
        ip: input.ip ?? null,
      },
    });
  } catch (error) {
    console.error("Audit write failure:", error);
  }
}
