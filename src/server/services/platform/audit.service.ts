import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";

export type AuditFilters = {
  action?: AuditAction;
  q?: string;
  page: number;
  pageSize: number;
};

/** Paginated audit trail across every tenant and platform scope. */
export async function listAuditLogs({
  action,
  q,
  page,
  pageSize,
}: AuditFilters) {
  const where: Prisma.AuditLogWhereInput = {};

  if (action) where.action = action;
  if (q) {
    where.OR = [
      { resource: { contains: q, mode: "insensitive" } },
      { resourceId: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { tenant: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        ipAddress: true,
        metadata: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

export async function getAuditActionCounts() {
  const groups = await prisma.auditLog.groupBy({
    by: ["action"],
    _count: { _all: true },
  });

  return groups.reduce<Record<string, number>>((accumulator, group) => {
    accumulator[group.action] = group._count._all;
    return accumulator;
  }, {});
}
