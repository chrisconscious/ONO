import { AuditAction, TenantStatus, TestimonialStatus } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";

export type TenantStatusCount = { status: TenantStatus; count: number };

export type DailyCount = { date: string; count: number };

function bucketByDay(dates: Date[], days: number): DailyCount[] {
  const buckets = new Map<string, number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    buckets.set(day.toISOString().slice(0, 10), 0);
  }

  for (const date of dates) {
    const key = new Date(date).toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

/**
 * Aggregates the operational picture for the platform console.
 * Every figure is computed from stored records; nothing is synthesised.
 */
export async function getPlatformOverview() {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 13);

  const [
    tenantsByStatus,
    totalUsers,
    platformAdminCount,
    activeSessions,
    pendingTestimonials,
    approvedTestimonials,
    recentTenants,
    recentActivity,
    recentTenantDates,
    recentLoginDates,
  ] = await Promise.all([
    prisma.tenant.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.count(),
    prisma.user.count({ where: { role: "PLATFORM_ADMIN" } }),
    prisma.session.count({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
    }),
    prisma.testimonial.count({ where: { status: TestimonialStatus.PENDING } }),
    prisma.testimonial.count({ where: { status: TestimonialStatus.APPROVED } }),
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        industry: true,
        createdAt: true,
        _count: { select: { memberships: true } },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        action: true,
        resource: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        tenant: { select: { name: true } },
      },
    }),
    prisma.tenant.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.auditLog.findMany({
      where: { action: AuditAction.LOGIN, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const statusCounts: TenantStatusCount[] = tenantsByStatus
    .map((group) => ({ status: group.status, count: group._count._all }))
    .sort((a, b) => b.count - a.count);

  const totalTenants = statusCounts.reduce((sum, item) => sum + item.count, 0);
  const activeTenants =
    statusCounts.find((item) => item.status === TenantStatus.ACTIVE)?.count ?? 0;

  return {
    totals: {
      tenants: totalTenants,
      activeTenants,
      users: totalUsers,
      platformAdmins: platformAdminCount,
      activeSessions,
      pendingTestimonials,
      approvedTestimonials,
    },
    statusCounts,
    recentTenants,
    recentActivity,
    tenantSignups: bucketByDay(
      recentTenantDates.map((item) => item.createdAt),
      14,
    ),
    loginActivity: bucketByDay(
      recentLoginDates.map((item) => item.createdAt),
      14,
    ),
  };
}

export type PlatformOverview = Awaited<ReturnType<typeof getPlatformOverview>>;
