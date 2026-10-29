import { prisma } from "@/lib/database/prisma";

/** In-app notification queries. External delivery is never implied. */
export async function listNotifications(params: {
  tenantId: string;
  userId: string;
  limit?: number;
}) {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { tenantId: params.tenantId, userId: params.userId },
      orderBy: { createdAt: "desc" },
      take: Math.min(50, Math.max(1, params.limit ?? 20)),
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { tenantId: params.tenantId, userId: params.userId, readAt: null },
    }),
  ]);

  return { items, unread };
}

export async function countUnreadNotifications(tenantId: string, userId: string) {
  return prisma.notification.count({
    where: { tenantId, userId, readAt: null },
  });
}

export async function markNotificationRead(params: {
  tenantId: string;
  userId: string;
  id?: string;
  all?: boolean;
}) {
  const where = params.all
    ? { tenantId: params.tenantId, userId: params.userId, readAt: null }
    : { tenantId: params.tenantId, userId: params.userId, id: params.id };

  if (!params.all && !params.id) {
    return { error: "Choose a notification or mark all as read." } as const;
  }

  const result = await prisma.notification.updateMany({
    where,
    data: { readAt: new Date() },
  });

  return { updated: result.count } as const;
}
