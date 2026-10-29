import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { hashPassword } from "@/lib/auth/password";

export async function listPlatformUsers({
  q,
  role,
  page,
  pageSize,
}: {
  q?: string;
  role?: UserRole;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.UserWhereInput = {};

  if (role) where.role = role;
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        memberships: {
          select: {
            tenant: { select: { id: true, name: true, slug: true } },
            status: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function getUserRoleCounts() {
  const groups = await prisma.user.groupBy({
    by: ["role"],
    _count: { _all: true },
  });

  return groups.reduce<Record<string, number>>((accumulator, group) => {
    accumulator[group.role] = group._count._all;
    return accumulator;
  }, {});
}

export async function createPlatformUser(input: {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}) {
  return prisma.user.create({
    data: {
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      passwordHash: hashPassword(input.password),
      role: input.role,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

export async function updateUserRole(userId: string, role: UserRole) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, name: true, role: true },
  });
}
