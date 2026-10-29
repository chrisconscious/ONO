import { cookies } from "next/headers";
import { prisma } from "@/lib/database/prisma";
import { WORKSPACE_COOKIE } from "@/lib/auth/guards";

export type ActorContext = {
  userId: string;
  tenantId: string | null;
  membershipId?: string;
  permissions: Set<string>;
  roles: string[];
};

/**
 * Resolves the acting user's tenant context.
 *
 * The active workspace is the explicitly requested one, otherwise the value of
 * the workspace cookie, otherwise the user's first membership. Only roles and
 * permissions belonging to that membership are returned, so holding a role in
 * one workspace never grants authority in another.
 *
 * A cookie that no longer maps to a membership fails closed: callers receive no
 * tenant context instead of silently operating on a different workspace.
 */
export async function getActorContext(
  userId: string,
  tenantId?: string,
): Promise<ActorContext> {
  const requestedTenantId = tenantId ?? (await readWorkspaceCookie());

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        where: requestedTenantId ? { tenantId: requestedTenantId } : undefined,
        include: {
          roleAssignments: {
            include: {
              role: { include: { rolePermissions: { include: { permission: true } } } },
            },
          },
        },
      },
    },
  });

  const membership = user?.memberships[0];
  const permissions = new Set<string>();
  const roles: string[] = [];

  if (membership) {
    for (const assignment of membership.roleAssignments) {
      roles.push(assignment.role.name);
      for (const rp of assignment.role.rolePermissions) {
        if (rp.permission.code) {
          permissions.add(rp.permission.code);
        }
      }
    }
  }

  return {
    userId,
    tenantId: membership?.tenantId ?? null,
    membershipId: membership?.id,
    permissions,
    roles,
  };
}

async function readWorkspaceCookie(): Promise<string | undefined> {
  try {
    const store = await cookies();
    return store.get(WORKSPACE_COOKIE)?.value;
  } catch {
    // Outside a request scope (for example a background job) there is no
    // cookie store; the caller must then pass an explicit tenant id.
    return undefined;
  }
}

export function hasPermission(ctx: ActorContext, permission: string): boolean {
  if (ctx.permissions.has("*")) return true;
  return ctx.permissions.has(permission);
}

export function requirePermission(ctx: ActorContext, permission: string) {
  if (!hasPermission(ctx, permission)) {
    throw new Error("FORBIDDEN");
  }
}

export function withTenantScope<T extends { tenantId: string }>(
  ctx: ActorContext,
  data: T
): T {
  if (!ctx.tenantId) throw new Error("NO_TENANT_CONTEXT");
  if (data.tenantId !== ctx.tenantId) throw new Error("TENANT_MISMATCH");
  return data;
}
