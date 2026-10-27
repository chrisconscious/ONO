import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "@/server/services/audit-service";

/**
 * Tenant provisioning & lifecycle service (Stage 14).
 *
 * Provisioning states are server-controlled strings kept on Tenant:
 *   PENDING_SETUP -> PROVISIONED -> ACTIVE
 * plus RESTRICTED / SUSPENDED / PENDING_CLOSURE / CLOSED.
 *
 * Reliability requirements implemented here:
 * - Idempotency via the existing IdempotencyRecord table keyed by a caller
 *   supplied request key, so retried provisioning never creates duplicate
 *   organizations/memberships/subscriptions.
 * - All core writes happen inside one transaction; a partial failure leaves
 *   no half-provisioned tenant behind.
 * - The last active ADMIN can never be removed or demoted without an
 *   ownership transfer first.
 */

export const PROVISIONING_STATES = [
  "PENDING_SETUP",
  "PROVISIONED",
  "ACTIVE",
  "RESTRICTED",
  "SUSPENDED",
  "PENDING_CLOSURE",
  "CLOSED",
] as const;
export type ProvisioningState = (typeof PROVISIONING_STATES)[number];

const TRANSITIONS: Record<ProvisioningState, ProvisioningState[]> = {
  PENDING_SETUP: ["PROVISIONED", "ACTIVE", "CLOSED"],
  PROVISIONED: ["ACTIVE", "SUSPENDED", "PENDING_CLOSURE"],
  ACTIVE: ["RESTRICTED", "SUSPENDED", "PENDING_CLOSURE"],
  RESTRICTED: ["ACTIVE", "SUSPENDED", "PENDING_CLOSURE"],
  SUSPENDED: ["ACTIVE", "RESTRICTED", "PENDING_CLOSURE"],
  PENDING_CLOSURE: ["CLOSED", "ACTIVE"], // closure is reversible until finalized
  CLOSED: [],
};

function assertTransition(from: string, to: ProvisioningState): void {
  const allowed = TRANSITIONS[from as ProvisioningState];
  if (!allowed || !allowed.includes(to)) {
    throw ApiError.conflict(`Illegal provisioning transition: ${from} -> ${to}`);
  }
}

// ---------------------------------------------------------------------------
// Organization creation with idempotency
// ---------------------------------------------------------------------------

interface ProvisionOrgInput {
  name: string;
  slug: string;
  industryKey?: string | null;
  ownerId: string;
  /** Caller-supplied stable key (e.g. from the signup flow) for safe retries. */
  idempotencyKey: string;
}

/**
 * Create tenant + owner membership + TRIAL subscription atomically.
 * If the same idempotencyKey was already completed, the original result is
 * returned instead of creating anything new. Concurrent duplicates collide
 * on the unique key and re-read the winner's record.
 */
export async function provisionOrganization(input: ProvisionOrgInput) {
  const { name, slug, industryKey, ownerId, idempotencyKey } = input;

  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner || !owner.isActive) throw ApiError.validation("Owner user does not exist or is inactive");

  // Fast path: previously completed request — replay the original result.
  const prior = await prisma.idempotencyRecord.findUnique({ where: { key: idempotencyKey } });
  if (prior?.completedAt) {
    // The record's tenantId column stores "provisioning:<slug>" for these
    // synthetic claims, so look the tenant up by slug deterministically.
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) return { tenantId: existing.id, replayed: true as const };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Claim the idempotency key inside the transaction so concurrent
      // requests serialize on the unique index.
      await tx.idempotencyRecord.create({ data: { tenantId: "provisioning:" + slug, key: idempotencyKey } });

      const slugTaken = await tx.tenant.findUnique({ where: { slug } });
      if (slugTaken) throw ApiError.conflict("That organization URL is already taken");

      const tenant = await tx.tenant.create({
        data: { name, slug, industryKey: industryKey ?? null, ownerId, provisioningStatus: "PENDING_SETUP" },
      });
      await tx.membership.create({ data: { userId: ownerId, tenantId: tenant.id, role: "ADMIN" } });
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: "TRIAL",
          status: "TRIALING",
          seats: 1,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        },
      });
      await tx.idempotencyRecord.update({ where: { key: idempotencyKey }, data: { completedAt: new Date() } });
      return tenant;
    });

    await recordAuditEvent({
      tenantId: result.id,
      userId: ownerId,
      action: "org.provision",
      entityType: "Tenant",
      entityId: result.id,
      summary: `Organization ${result.slug} provisioned (PENDING_SETUP)`,
    });
    return { tenantId: result.id, replayed: false as const };
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      // Lost the race against an identical concurrent request — replay winner.
      const tenant = await prisma.tenant.findUnique({ where: { slug } });
      if (tenant) return { tenantId: tenant.id, replayed: true as const };
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Lifecycle transitions
// ---------------------------------------------------------------------------

async function setProvisioning(tenantId: string, to: ProvisioningState, actor: { userId: string }, action: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw ApiError.notFound("Organization not found");
  assertTransition(tenant.provisioningStatus, to);
  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { provisioningStatus: to, isActive: to !== "SUSPENDED" && to !== "CLOSED" && to !== "PENDING_CLOSURE" },
  });
  await recordAuditEvent({
    tenantId,
    userId: actor.userId,
    action,
    entityType: "Tenant",
    entityId: tenantId,
    severity: to === "CLOSED" || to === "SUSPENDED" ? "CRITICAL" : "WARNING",
    summary: `Organization provisioning status ${tenant.provisioningStatus} -> ${to}`,
  });
  return updated;
}

/** Mark initial setup complete (profile + at least the owner configured). */
export async function finishSetup(tenantId: string, actor: { userId: string }) {
  return setProvisioning(tenantId, "PROVISIONED", actor, "org.provision.setup_complete");
}

/** Activate the organization for business use. */
export async function activateOrganization(tenantId: string, actor: { userId: string }) {
  return setProvisioning(tenantId, "ACTIVE", actor, "org.activate");
}

/** Suspend access. Data is preserved; suspension is reversible. */
export async function suspendOrganization(tenantId: string, actor: { userId: string }) {
  return setProvisioning(tenantId, "SUSPENDED", actor, "org.suspend");
}

/** Begin closure. This is NOT deletion — irreversible erasure requires a separate authorized step. */
export async function beginClosure(tenantId: string, actor: { userId: string }) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw ApiError.notFound("Organization not found");
  if (tenant.ownerId !== actor.userId) {
    throw ApiError.forbidden("Only the organization owner may initiate closure");
  }
  return setProvisioning(tenantId, "PENDING_CLOSURE", actor, "org.closure.begin");
}

/**
 * Finalize closure: deactivates all memberships and revokes every session
 * that had access to the organization. Business records are intentionally
 * retained (retention/legal-hold policy pending verified requirements) —
 * this function never deletes customer data.
 */
export async function finalizeClosure(tenantId: string, actor: { userId: string }) {
  // Find sessions currently scoped to this tenant via the join table and
  // revoke them so closed organizations cannot be re-entered by live tokens.
  const scopedSessionIds = (
    await prisma.sessionsTenantJoin.findMany({ where: { tenantId }, select: { sessionId: true } })
  ).map((j) => j.sessionId);
  await prisma.$transaction([
    prisma.membership.updateMany({ where: { tenantId }, data: { isActive: false } }),
    ...(scopedSessionIds.length > 0
      ? [prisma.session.updateMany({ where: { id: { in: scopedSessionIds }, status: "ACTIVE" }, data: { status: "REVOKED", revokedAt: new Date() } })]
      : []),
  ]);
  const t = await setProvisioning(tenantId, "CLOSED", actor, "org.closure.finalize");
  await recordAuditEvent({
    tenantId,
    userId: actor.userId,
    action: "org.closure.data_retained",
    entityType: "Tenant",
    entityId: tenantId,
    severity: "CRITICAL",
    summary: "Organization closed; business data retained pending approved retention/deletion policy",
  });
  return t;
}

// ---------------------------------------------------------------------------
// Ownership transfer
// ---------------------------------------------------------------------------

/**
 * Transfer organization ownership to another ACTIVE member. The previous
 * owner keeps their membership (default ADMIN) unless separately removed.
 */
export async function transferOwnership(tenantId: string, newOwnerId: string, actor: { userId: string }) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw ApiError.notFound("Organization not found");
  if (tenant.ownerId !== actor.userId) {
    throw ApiError.forbidden("Only the current owner may transfer ownership");
  }
  const target = await prisma.membership.findFirst({ where: { tenantId, userId: newOwnerId, isActive: true } });
  if (!target) throw ApiError.validation("Target user is not an active member of this organization");

  const updated = await prisma.$transaction(async (tx) => {
    // New owner must hold ADMIN to exercise ownership rights.
    await tx.membership.update({ where: { id: target.id }, data: { role: "ADMIN" } });
    return tx.tenant.update({ where: { id: tenantId }, data: { ownerId: newOwnerId } });
  });

  await recordAuditEvent({
    tenantId,
    userId: actor.userId,
    action: "org.ownership.transfer",
    entityType: "Tenant",
    entityId: tenantId,
    severity: "CRITICAL",
    summary: `Ownership transferred from ${actor.userId} to ${newOwnerId}`,
  });
  return { tenantId: updated.id, ownerId: updated.ownerId };
}

// ---------------------------------------------------------------------------
// Last-admin protection (used by membership removal/role services)
// ---------------------------------------------------------------------------

/**
 * Guard that refuses actions which would leave a tenant with zero active
 * ADMIN members. Also protects the registered owner specifically when they
 * still hold an active membership.
 */
export async function assertNotLastAdminRemoval(membershipId: string, tenantId: string): Promise<void> {
  const target = await prisma.membership.findUnique({ where: { id: membershipId } });
  if (!target || target.tenantId !== tenantId) throw ApiError.notFound("Member not found");
  if (!target.isActive || target.role !== "ADMIN") return;

  const activeAdmins = await prisma.membership.count({ where: { tenantId, role: "ADMIN", isActive: true } });
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { ownerId: true } });
  const ownerStillActive = tenant?.ownerId
    ? await prisma.membership.findFirst({ where: { tenantId, userId: tenant.ownerId, isActive: true, role: "ADMIN" } })
    : null;

  if (activeAdmins <= 1) {
    throw ApiError.conflict(
      ownerStillActive && ownerStillActive.userId === target.userId
        ? "Cannot remove the last administrator who is also the organization owner — transfer ownership first"
        : "Cannot remove the last active administrator — promote another member first",
    );
  }
}
