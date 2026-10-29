import { InvoiceStatus, LeadStatus, Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";

/** Headline figures and recent movement for one tenant workspace. */
export async function getWorkspaceOverview(tenantId: string) {
  const openInvoiceStatuses: InvoiceStatus[] = [
    InvoiceStatus.SENT,
    InvoiceStatus.PARTIALLY_PAID,
    InvoiceStatus.OVERDUE,
  ];

  const [
    leads,
    qualifiedLeads,
    openTasks,
    overdueTasks,
    contacts,
    companies,
    opportunities,
    projects,
    supportCases,
    openInvoiceTotals,
    paidInvoiceTotals,
    recentLeads,
    upcomingTasks,
    recentActivity,
  ] = await Promise.all([
    prisma.lead.count({ where: { tenantId } }),
    prisma.lead.count({
      where: { tenantId, status: { in: [LeadStatus.QUALIFIED, LeadStatus.CONVERTED] } },
    }),
    prisma.task.count({
      where: { tenantId, status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW] } },
    }),
    prisma.task.count({
      where: { tenantId, dueDate: { lt: new Date() }, status: { not: TaskStatus.DONE } },
    }),
    prisma.contact.count({ where: { tenantId } }),
    prisma.company.count({ where: { tenantId } }),
    prisma.opportunity.count({ where: { tenantId } }),
    prisma.project.count({ where: { tenantId } }),
    prisma.supportCase.count({ where: { tenantId } }),
    prisma.invoice.aggregate({
      where: { tenantId, status: { in: openInvoiceStatuses } },
      _sum: { balance: true },
      _count: { _all: true },
    }),
    prisma.invoice.aggregate({
      where: { tenantId, status: InvoiceStatus.PAID },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.lead.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.task.findMany({
      where: {
        tenantId,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW] },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        assignee: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        action: true,
        resource: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return {
    totals: {
      leads,
      qualifiedLeads,
      openTasks,
      overdueTasks,
      contacts,
      companies,
      opportunities,
      projects,
      supportCases,
      openInvoices: openInvoiceTotals._count._all,
      outstandingBalance: Number(openInvoiceTotals._sum.balance ?? 0),
      paidInvoices: paidInvoiceTotals._count._all,
      collectedRevenue: Number(paidInvoiceTotals._sum.total ?? 0),
    },
    recentLeads,
    upcomingTasks: withOverdueFlag(upcomingTasks),
    recentActivity,
  };
}

/**
 * Adds a server-computed overdue flag so React render code never has to read
 * the ambient clock, which would make rendering impure.
 */
function withOverdueFlag<T extends { dueDate: Date | null; status: TaskStatus }>(
  tasks: T[],
) {
  const now = Date.now();
  const closed: TaskStatus[] = [TaskStatus.DONE, TaskStatus.CANCELLED];

  return tasks.map((task) => ({
    ...task,
    isOverdue:
      task.dueDate != null &&
      task.dueDate.getTime() < now &&
      !closed.includes(task.status),
  }));
}

export async function listWorkspaceLeads({
  tenantId,
  q,
  status,
  page,
  pageSize,
}: {
  tenantId: string;
  q?: string;
  status?: LeadStatus;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.LeadWhereInput = { tenantId };

  if (status) where.status = status;
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyName: true,
        source: true,
        status: true,
        createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return { leads, total };
}

export async function listWorkspaceTasks({
  tenantId,
  q,
  status,
  page,
  pageSize,
}: {
  tenantId: string;
  q?: string;
  status?: TaskStatus;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.TaskWhereInput = { tenantId };

  if (status) where.status = status;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        dueDate: true,
        createdAt: true,
        assignee: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks: withOverdueFlag(tasks), total };
}

export async function listWorkspaceMembers(tenantId: string) {
  return prisma.membership.findMany({
    where: { tenantId },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      status: true,
      joinedAt: true,
      user: {
        select: { id: true, name: true, email: true, lastLoginAt: true, role: true },
      },
      roleAssignments: {
        select: { id: true, role: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function listWorkspaceRoles(tenantId: string) {
  return prisma.role.findMany({
    where: { tenantId },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      isSystem: true,
      _count: { select: { rolePermissions: true, roleAssignments: true } },
    },
  });
}

/** Tenant profile fields used by the workspace settings screen. */
export async function getWorkspaceTenant(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      industry: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/** Active members who can be assigned work in this tenant. */
export async function listAssignableMembers(tenantId: string) {
  return prisma.membership.findMany({
    where: { tenantId, status: "ACTIVE" },
    orderBy: { user: { name: "asc" } },
    select: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/** Recent testimonial submissions from a workspace, newest first. */
export async function listTenantTestimonials(tenantId: string, take = 3) {
  return prisma.testimonial.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      quote: true,
      rating: true,
      status: true,
      authorName: true,
      createdAt: true,
      reviewedAt: true,
    },
  });
}

/**
 * Operational analytics assembled from stored records. Monthly series are
 * bucketed on the server so the page never invents or simulates figures.
 */
export async function getWorkspaceAnalytics(tenantId: string, months = 6) {
  const safeMonths = Math.min(12, Math.max(3, months));
  const now = new Date();
  const seriesStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (safeMonths - 1), 1),
  );

  const [
    pipeline,
    invoiceStatuses,
    taskStatuses,
    projectStatuses,
    supportStatuses,
    payments,
    expenses,
    overdueInvoices,
    opportunitiesWon,
  ] = await Promise.all([
    prisma.opportunity.groupBy({
      by: ["stage"],
      where: { tenantId },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: { tenantId },
      _sum: { balance: true, total: true },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { _all: true },
    }),
    prisma.project.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { _all: true },
    }),
    prisma.supportCase.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { _all: true },
    }),
    prisma.payment.findMany({
      where: { tenantId, paidAt: { gte: seriesStart } },
      select: { paidAt: true, amount: true },
    }),
    prisma.expense.findMany({
      where: { tenantId, expenseDate: { gte: seriesStart } },
      select: { expenseDate: true, amount: true, status: true },
    }),
    prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
        dueDate: { lt: now },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        dueDate: true,
        balance: true,
        currency: true,
        status: true,
      },
    }),
    prisma.opportunity.aggregate({
      where: { tenantId, stage: "CLOSED_WON" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const buckets = Array.from({ length: safeMonths }).map((_, index) => {
    const date = new Date(
      Date.UTC(
        seriesStart.getUTCFullYear(),
        seriesStart.getUTCMonth() + index,
        1,
      ),
    );
    return {
      key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("en-GB", {
        month: "short",
        timeZone: "UTC",
      }),
      revenue: 0,
      expenses: 0,
    };
  });

  const bucketIndex = new Map(buckets.map((bucket, index) => [bucket.key, index]));

  for (const payment of payments) {
    const key = `${payment.paidAt.getUTCFullYear()}-${String(
      payment.paidAt.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
    const index = bucketIndex.get(key);
    if (index !== undefined) buckets[index].revenue += Number(payment.amount);
  }

  for (const expense of expenses) {
    if (expense.status === "REJECTED") continue;
    const key = `${expense.expenseDate.getUTCFullYear()}-${String(
      expense.expenseDate.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
    const index = bucketIndex.get(key);
    if (index !== undefined) buckets[index].expenses += Number(expense.amount);
  }

  const pipelineValue = pipeline.reduce(
    (sum, entry) => sum + Number(entry._sum.amount ?? 0),
    0,
  );
  const openPipeline = pipeline
    .filter((entry) => entry.stage !== "CLOSED_WON" && entry.stage !== "CLOSED_LOST")
    .reduce((sum, entry) => sum + Number(entry._sum.amount ?? 0), 0);
  const outstanding = invoiceStatuses.reduce(
    (sum, entry) => sum + Number(entry._sum.balance ?? 0),
    0,
  );
  const collected = invoiceStatuses
    .filter((entry) => entry.status === InvoiceStatus.PAID)
    .reduce((sum, entry) => sum + Number(entry._sum.total ?? 0), 0);

  return {
    months: safeMonths,
    buckets,
    pipeline: pipeline
      .map((entry) => ({
        stage: entry.stage,
        count: entry._count._all,
        value: Number(entry._sum.amount ?? 0),
      }))
      .sort((a, b) => b.value - a.value),
    invoiceStatuses: invoiceStatuses.map((entry) => ({
      status: entry.status,
      count: entry._count._all,
      balance: Number(entry._sum.balance ?? 0),
      total: Number(entry._sum.total ?? 0),
    })),
    taskStatuses: taskStatuses.map((entry) => ({
      status: entry.status,
      count: entry._count._all,
    })),
    projectStatuses: projectStatuses.map((entry) => ({
      status: entry.status,
      count: entry._count._all,
    })),
    supportStatuses: supportStatuses.map((entry) => ({
      status: entry.status,
      count: entry._count._all,
    })),
    overdueInvoices,
    totals: {
      pipelineValue,
      openPipeline,
      outstanding,
      collected,
      wonValue: Number(opportunitiesWon._sum.amount ?? 0),
      wonCount: opportunitiesWon._count._all,
      revenueInPeriod: buckets.reduce((sum, bucket) => sum + bucket.revenue, 0),
      expensesInPeriod: buckets.reduce((sum, bucket) => sum + bucket.expenses, 0),
    },
  };
}
