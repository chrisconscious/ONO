import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "@/server/services/audit-service";
import {
  addBranchSchema,
  addDepartmentSchema,
  setSettingSchema,
  updateOrganizationSchema,
} from "@/lib/validation/schemas";

/** Global industry catalogue — platform-managed. "other" is always available. */
export async function listIndustryCatalogue() {
  const industries = await prisma.industryCatalogue.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return {
    industries,
    otherOption: {
      key: "other",
      name: "Other — my industry is not listed",
      description:
        "Choose this to define a custom industry with your own name, description and business activities.",
    },
  };
}

export async function getOrganization(ctx: { tenantId: string }) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    include: {
      industryCatalogue: true,
      customIndustries: true,
      branches: { where: { isActive: true } },
      departments: true,
      settings: true,
      subscription: true,
    },
  });
  if (!tenant) throw ApiError.notFound("Organization not found");
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    industryKey: tenant.industryKey,
    industry: tenant.industryCatalogue
      ? { key: tenant.industryCatalogue.key, name: tenant.industryCatalogue.name }
      : null,
    customIndustries: tenant.customIndustries,
    branches: tenant.branches,
    departments: tenant.departments,
    settings: tenant.settings.map((s) => ({ key: s.key, value: s.value })),
    subscription: tenant.subscription
      ? { plan: tenant.subscription.plan, status: tenant.subscription.status, seats: tenant.subscription.seats }
      : null,
    createdAt: tenant.createdAt,
  };
}

/**
 * Update org profile + industry configuration. Custom industry ("Other") is
 * stored per-tenant; changing it never touches another tenant's rows because
 * every write is keyed by the verified ctx.tenantId.
 */
export async function updateOrganization(
  input: unknown,
  ctx: { tenantId: string; userId: string },
) {
  const data = updateOrganizationSchema.parse(input);

  if (data.industryKey !== undefined && data.industryKey !== null) {
    if (data.industryKey !== "other") {
      const known = await prisma.industryCatalogue.findUnique({ where: { key: data.industryKey } });
      if (!known) throw ApiError.validation(`Unknown industry key: ${data.industryKey}`);
    }
  }

  const tenant = await prisma.$transaction(async (tx) => {
    const updated = await tx.tenant.update({
      where: { id: ctx.tenantId },
      data: {
        name: data.name,
        slug: data.slug,
        ...(data.industryKey !== undefined ? { industryKey: data.industryKey } : {}),
      },
    });
    if (data.customIndustry) {
      await tx.customIndustry.upsert({
        where: { tenantId_name: { tenantId: ctx.tenantId, name: data.customIndustry.name } },
        create: {
          tenantId: ctx.tenantId,
          name: data.customIndustry.name,
          description: data.customIndustry.description,
          activities: data.customIndustry.activities ?? [],
        },
        update: {
          description: data.customIndustry.description,
          activities: data.customIndustry.activities ?? [],
        },
      });
    }
    return updated;
  });

  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "org.update",
    entityType: "Tenant",
    entityId: tenant.id,
    summary: "Organization profile updated",
    metadata: { fields: Object.keys(data) },
  });
  return getOrganization(ctx);
}

export async function setOrganizationSetting(
  input: unknown,
  ctx: { tenantId: string; userId: string },
) {
  const data = setSettingSchema.parse(input);
  const setting = await prisma.organizationSetting.upsert({
    where: { tenantId_key: { tenantId: ctx.tenantId, key: data.key } },
    create: { tenantId: ctx.tenantId, key: data.key, value: data.value as object },
    update: { value: data.value as object },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "org.setting.update",
    entityType: "OrganizationSetting",
    entityId: setting.id,
    summary: `Setting '${data.key}' updated`,
  });
  return { key: setting.key, value: setting.value };
}

export async function listOrganizationSettings(ctx: { tenantId: string }) {
  const settings = await prisma.organizationSetting.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { key: "asc" },
  });
  return settings.map((s) => ({ key: s.key, value: s.value }));
}

export async function addBranch(input: unknown, ctx: { tenantId: string; userId: string }) {
  const data = addBranchSchema.parse(input);
  try {
    const branch = await prisma.branch.create({
      data: { tenantId: ctx.tenantId, ...data },
    });
    await recordAuditEvent({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "org.branch.create",
      entityType: "Branch",
      entityId: branch.id,
      summary: `Branch ${branch.name} (${branch.code}) created`,
    });
    return branch;
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      throw ApiError.conflict(`Branch code '${data.code}' already exists`);
    }
    throw e;
  }
}

export async function addDepartment(input: unknown, ctx: { tenantId: string; userId: string }) {
  const data = addDepartmentSchema.parse(input);
  // Validate referenced entities belong to the same tenant (no cross-tenant links).
  if (data.branchId) {
    const b = await prisma.branch.findFirst({ where: { id: data.branchId, tenantId: ctx.tenantId } });
    if (!b) throw ApiError.validation("branchId does not belong to this organization");
  }
  if (data.parentId) {
    const p = await prisma.department.findFirst({
      where: { id: data.parentId, tenantId: ctx.tenantId },
    });
    if (!p) throw ApiError.validation("parentId does not belong to this organization");
  }
  try {
    const department = await prisma.department.create({
      data: { tenantId: ctx.tenantId, name: data.name, branchId: data.branchId, parentId: data.parentId },
    });
    await recordAuditEvent({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "org.department.create",
      entityType: "Department",
      entityId: department.id,
      summary: `Department ${department.name} created`,
    });
    return department;
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      throw ApiError.conflict(`Department '${data.name}' already exists`);
    }
    throw e;
  }
}

export async function listAuditLogs(
  ctx: { tenantId: string },
  query: { page: number; pageSize: number; action?: string },
) {
  const where = {
    tenantId: ctx.tenantId,
    ...(query.action ? { action: { contains: query.action } } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { user: { select: { email: true } } },
    }),
  ]);
  return {
    total,
    page: query.page,
    pageSize: query.pageSize,
    items: items.map((a) => ({
      id: a.id,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      severity: a.severity,
      summary: a.summary,
      actorEmail: a.user?.email ?? null,
      ip: a.ip,
      createdAt: a.createdAt,
    })),
  };
}
