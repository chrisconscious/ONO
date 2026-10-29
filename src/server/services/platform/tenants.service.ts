import { Prisma, TenantStatus } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";

export type TenantListFilters = {
  q?: string;
  status?: TenantStatus;
  page: number;
  pageSize: number;
};

export async function listTenants({
  q,
  status,
  page,
  pageSize,
}: TenantListFilters) {
  const where: Prisma.TenantWhereInput = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { industry: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) {
    where.status = status;
  }

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        industry: true,
        createdAt: true,
        _count: {
          select: {
            memberships: true,
            roles: true,
            leads: true,
            invoices: true,
            supportCases: true,
          },
        },
      },
    }),
    prisma.tenant.count({ where }),
  ]);

  return { tenants, total };
}

export async function getTenantDetail(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      memberships: {
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              lastLoginAt: true,
            },
          },
          roleAssignments: { include: { role: { select: { name: true } } } },
        },
      },
      roles: {
        select: {
          id: true,
          name: true,
          description: true,
          isSystem: true,
          _count: { select: { rolePermissions: true, roleAssignments: true } },
        },
      },
      _count: {
        select: {
          memberships: true,
          leads: true,
          contacts: true,
          companies: true,
          opportunities: true,
          quotations: true,
          salesOrders: true,
          invoices: true,
          expenses: true,
          purchaseOrders: true,
          projects: true,
          supportCases: true,
          documents: true,
        },
      },
    },
  });

  if (!tenant) return null;

  const recentAudit = await prisma.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      action: true,
      resource: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  return { tenant, recentAudit };
}

export async function setTenantStatus(tenantId: string, status: TenantStatus) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { status },
    select: { id: true, name: true, status: true },
  });
}

export async function createTenantRecord(input: {
  name: string;
  slug: string;
  industry?: string | null;
  status?: TenantStatus;
}) {
  return prisma.tenant.create({
    data: {
      name: input.name,
      slug: input.slug,
      industry: input.industry ?? null,
      status: input.status ?? TenantStatus.ACTIVE,
    },
    select: { id: true, name: true, slug: true, status: true, createdAt: true },
  });
}

export const tenantStatusValues = Object.values(TenantStatus);
