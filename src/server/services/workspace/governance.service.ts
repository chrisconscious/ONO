import { prisma } from "@/lib/database/prisma";
import { PERMISSIONS } from "@/lib/permissions/catalog";

/** Permission codes grouped for the role editor. */
export function permissionCatalogue() {
  return PERMISSIONS.map((permission) => ({
    code: permission.code,
    module: permission.module,
    resource: permission.resource,
    action: permission.action,
    description: permission.description,
  }));
}

/** Updates the tenant-editable workspace profile fields. */
export async function updateWorkspaceIndustry(tenantId: string, industry: string) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { industry: industry.trim() || null },
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

export type WorkspaceRoleDetail = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  assignedCount: number;
  permissionCodes: string[];
};

/** Roles with their permission codes, used by the role editor. */
export async function listWorkspaceRoleDetails(
  tenantId: string,
): Promise<WorkspaceRoleDetail[]> {
  const roles = await prisma.role.findMany({
    where: { tenantId },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      isSystem: true,
      _count: { select: { roleAssignments: true } },
      rolePermissions: { select: { permission: { select: { code: true } } } },
    },
  });

  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    assignedCount: role._count.roleAssignments,
    permissionCodes: role.rolePermissions.map((entry) => entry.permission.code).sort(),
  }));
}

/** Resolves catalogue codes to the permission rows seeded for this database. */
async function resolvePermissions(codes: string[]): Promise<{
  rows: Array<{ id: string; code: string }>;
  unknown: string[];
}> {
  const unique = [...new Set(codes)];
  if (unique.length === 0) return { rows: [], unknown: [] };

  const rows = await prisma.permission.findMany({
    where: { code: { in: unique } },
    select: { id: true, code: true },
  });

  const known = new Set(rows.map((row) => row.code));
  const unknown = unique.filter((code) => !known.has(code));

  return { rows, unknown };
}

export type RoleMutationResult =
  | { role: WorkspaceRoleDetail }
  | { error: string };

/** Creates a custom workspace role with the selected permissions. */
export async function createWorkspaceRole(params: {
  tenantId: string;
  name: string;
  description?: string;
  permissionCodes: string[];
}): Promise<RoleMutationResult> {
  const { tenantId, name, description, permissionCodes } = params;

  const resolved = await resolvePermissions(permissionCodes);
  if (resolved.unknown.length > 0) {
    return { error: `Unknown permission: ${resolved.unknown[0]}.` };
  }

  const existing = await prisma.role.findFirst({
    where: { tenantId, name: name.trim() },
    select: { id: true },
  });
  if (existing) {
    return { error: "A role with that name already exists in this workspace." };
  }

  const role = await prisma.role.create({
    data: {
      tenantId,
      name: name.trim(),
      description: description?.trim() || null,
      isSystem: false,
      rolePermissions: {
        create: resolved.rows.map((permission) => ({
          tenantId,
          permissionId: permission.id,
        })),
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      isSystem: true,
      _count: { select: { roleAssignments: true } },
      rolePermissions: { select: { permission: { select: { code: true } } } },
    },
  });

  return {
    role: {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      assignedCount: role._count.roleAssignments,
      permissionCodes: role.rolePermissions
        .map((entry) => entry.permission.code)
        .sort(),
    },
  };
}

/** Updates a custom role. System roles remain managed by the platform. */
export async function updateWorkspaceRole(params: {
  tenantId: string;
  roleId: string;
  name: string;
  description?: string;
  permissionCodes: string[];
}): Promise<RoleMutationResult> {
  const { tenantId, roleId, name, description, permissionCodes } = params;

  const existing = await prisma.role.findFirst({
    where: { id: roleId, tenantId },
    select: { id: true, isSystem: true },
  });
  if (!existing) return { error: "Role not found in this workspace." };
  if (existing.isSystem) {
    return { error: "System roles cannot be edited. Create a custom role instead." };
  }

  const duplicate = await prisma.role.findFirst({
    where: { tenantId, name: name.trim(), id: { not: roleId } },
    select: { id: true },
  });
  if (duplicate) {
    return { error: "A role with that name already exists in this workspace." };
  }

  const resolved = await resolvePermissions(permissionCodes);
  if (resolved.unknown.length > 0) {
    return { error: `Unknown permission: ${resolved.unknown[0]}.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: { id: roleId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    await tx.rolePermission.deleteMany({ where: { roleId } });

    if (resolved.rows.length > 0) {
      await tx.rolePermission.createMany({
        data: resolved.rows.map((permission) => ({
          tenantId,
          roleId,
          permissionId: permission.id,
        })),
      });
    }
  });

  const role = await prisma.role.findUniqueOrThrow({
    where: { id: roleId },
    select: {
      id: true,
      name: true,
      description: true,
      isSystem: true,
      _count: { select: { roleAssignments: true } },
      rolePermissions: { select: { permission: { select: { code: true } } } },
    },
  });

  return {
    role: {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      assignedCount: role._count.roleAssignments,
      permissionCodes: role.rolePermissions
        .map((entry) => entry.permission.code)
        .sort(),
    },
  };
}

/** Replaces one member's role assignments with the supplied role ids. */
export async function assignMemberRoles(params: {
  tenantId: string;
  membershipId: string;
  roleIds: string[];
  actorMembershipId: string;
}) {
  const { tenantId, membershipId, roleIds, actorMembershipId } = params;

  if (membershipId === actorMembershipId) {
    return {
      error:
        "You cannot change your own roles. Ask another workspace administrator with member access.",
    } as const;
  }

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, tenantId },
    select: { id: true },
  });
  if (!membership) return { error: "Member not found in this workspace." } as const;

  const unique = [...new Set(roleIds)];
  const roles = await prisma.role.findMany({
    where: { tenantId, id: { in: unique } },
    select: { id: true },
  });
  if (roles.length !== unique.length) {
    return { error: "One or more roles do not belong to this workspace." } as const;
  }

  if (unique.length === 0) {
    return { error: "Assign at least one role to keep the member able to sign in." } as const;
  }

  await prisma.$transaction(async (tx) => {
    await tx.roleAssignment.deleteMany({ where: { membershipId } });

    if (unique.length > 0) {
      await tx.roleAssignment.createMany({
        data: unique.map((roleId) => ({ membershipId, roleId })),
      });
    }
  });

  return { ok: true } as const;
}
