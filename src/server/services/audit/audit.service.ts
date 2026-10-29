import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { AuditAction } from "@prisma/client";

export async function createAuditLog(params: {
  tenantId?: string | null;
  userId?: string | null;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId || null,
        userId: params.userId || null,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
