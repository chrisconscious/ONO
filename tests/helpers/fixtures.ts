/**
 * Test fixtures and synthetic data factories for the integration suite.
 *
 * Every fixture creates a fully isolated tenant + user + membership and a
 * ready-made TenantContext, so service-layer tests exercise the same
 * server-side authorization data that real API routes would build.
 *
 * All data is synthetic (random slugs/emails) — never real customer records.
 */
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/database/prisma";
import { hashPassword } from "@/lib/auth/password";
import { permissionsForRole, type Permission } from "@/lib/permissions/rbac";
import type { TenantContext } from "@/lib/auth/session";
import type { MemberRole } from "@prisma/client";

export interface FixtureUser {
  userId: string;
  email: string;
  tenantId: string;
  role: MemberRole;
  membershipId: string;
  ctx: TenantContext;
}

/**
 * Create an isolated tenant with a single user holding `role`.
 * The returned TenantContext mirrors what requireTenantMembership() builds
 * at runtime (server-resolved permissions — never client-supplied).
 */
export async function makeTenantWithUser(
  role: MemberRole = "ADMIN",
  opts?: { tenantName?: string },
): Promise<FixtureUser> {
  const id = randomUUID().slice(0, 8);
  const passwordHash = await hashPassword(`test-password-${id}`);
  const tenant = await prisma.tenant.create({
    data: {
      name: opts?.tenantName ?? `Test Org ${id}`,
      slug: `test-org-${id}`,
    },
  });
  const user = await prisma.user.create({
    data: {
      email: `user-${id}@example.test`,
      name: `Test User ${id}`,
      passwordHash,
      isVerified: true,
    },
  });
  const membership = await prisma.membership.create({
    data: { userId: user.id, tenantId: tenant.id, role },
  });
  const ctx: TenantContext = {
    user: { id: user.id, email: user.email, name: user.name },
    tenantId: tenant.id,
    role: membership.role,
    membershipId: membership.id,
    permissions: permissionsForRole(membership.role),
    sessionId: "",
  };
  return { userId: user.id, email: user.email, tenantId: tenant.id, role, membershipId: membership.id, ctx };
}

/** Add another user with a given role to an existing tenant. */
export async function addMember(tenantId: string, role: MemberRole): Promise<FixtureUser> {
  const id = randomUUID().slice(0, 8);
  const passwordHash = await hashPassword(`test-password-${id}`);
  const user = await prisma.user.create({
    data: {
      email: `member-${id}@example.test`,
      name: `Member ${id}`,
      passwordHash,
      isVerified: true,
    },
  });
  const membership = await prisma.membership.create({
    data: { userId: user.id, tenantId, role },
  });
  const ctx: TenantContext = {
    user: { id: user.id, email: user.email, name: user.name },
    tenantId,
    role: membership.role,
    membershipId: membership.id,
    permissions: permissionsForRole(membership.role),
    sessionId: "",
  };
  return { userId: user.id, email: user.email, tenantId, role, membershipId: membership.id, ctx };
}

/** Build a TenantContext for an arbitrary membership (e.g. after role change). */
export async function contextForMembership(membershipId: string): Promise<TenantContext> {
  const m = await prisma.membership.findUniqueOrThrow({
    where: { id: membershipId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  return {
    user: { id: m.user.id, email: m.user.email, name: m.user.name },
    tenantId: m.tenantId,
    role: m.role,
    membershipId: m.id,
    permissions: permissionsForRole(m.role),
    sessionId: "",
  };
}

/** Assert helper: does the context effectively hold the permission? */
export function ctxHasPermission(ctx: TenantContext, p: Permission): boolean {
  return ctx.permissions.has(p);
}

// ---------------------------------------------------------------------------
// Common master-data factories
// ---------------------------------------------------------------------------

export async function makeCompany(ctx: TenantContext, name?: string) {
  return prisma.company.create({
    data: { tenantId: ctx.tenantId, name: name ?? `Acme ${randomUUID().slice(0, 8)}` },
  });
}

export async function makeProduct(
  ctx: TenantContext,
  opts?: { sku?: string; unitPrice?: string; type?: "GOODS" | "SERVICE"; reorderPoint?: number },
) {
  return prisma.product.create({
    data: {
      tenantId: ctx.tenantId,
      sku: opts?.sku ?? `SKU-${randomUUID().slice(0, 8).toUpperCase()}`,
      name: "Test product",
      type: opts?.type ?? "GOODS",
      unitPrice: opts?.unitPrice ?? "100.00",
      reorderPoint: opts?.reorderPoint ?? 0,
    },
  });
}

export async function makeWarehouse(ctx: TenantContext, code?: string) {
  return prisma.warehouse.create({
    data: {
      tenantId: ctx.tenantId,
      name: "Main Warehouse",
      code: code ?? `WH${randomUUID().slice(0, 4).toUpperCase()}`,
      isPrimary: true,
    },
  });
}

export async function makeLead(ctx: TenantContext, email?: string) {
  return prisma.lead.create({
    data: {
      tenantId: ctx.tenantId,
      title: "Test lead",
      email: email ?? `lead-${randomUUID().slice(0, 8)}@prospect.example`,
      ownerId: ctx.user.id,
      status: "NEW",
    },
  });
}

export async function makeOpportunity(
  ctx: TenantContext,
  opts?: { amount?: string; stage?: "IDENTIFICATION" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST"; probability?: number },
) {
  return prisma.opportunity.create({
    data: {
      tenantId: ctx.tenantId,
      name: "Test opportunity",
      amount: opts?.amount,
      stage: opts?.stage,
      probability: opts?.probability,
      ownerId: ctx.user.id,
    },
  });
}
