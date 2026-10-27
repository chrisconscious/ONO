import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import { recordAuditEvent } from "@/server/services/audit-service";
import type { MemberRole } from "@prisma/client";
import {
  acceptInvitationSchema,
  inviteMemberSchema,
  registerSchema,
  signInSchema,
} from "@/lib/validation/schemas";

const INVITATION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// ---------------------------------------------------------------------------
// Registration: creates user + tenant + ADMIN membership atomically.
// ---------------------------------------------------------------------------

export async function register(input: unknown) {
  const data = registerSchema.parse(input);

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existingUser) throw ApiError.conflict("An account with this email already exists");
  const existingTenant = await prisma.tenant.findUnique({ where: { slug: data.organizationSlug } });
  if (existingTenant) throw ApiError.conflict("That organization URL is already taken");

  const passwordHash = await hashPassword(data.password);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash,
        isVerified: true, // email verification via provider deferred; invitations gate team access
      },
    });
    const tenant = await tx.tenant.create({
      data: {
        name: data.organizationName,
        slug: data.organizationSlug,
        industryKey: data.industryKey ?? null,
        ownerId: user.id,
        provisioningStatus: "PENDING_SETUP",
      },
    });
    await tx.membership.create({
      data: { userId: user.id, tenantId: tenant.id, role: "ADMIN" },
    });
    await tx.subscription.create({
      data: {
        tenantId: tenant.id,
        // New self-serve organizations start on a time-boxed trial with an
        // explicit current period so billing/entitlement logic has real data.
        plan: "TRIAL",
        status: "TRIALING",
        seats: 1,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      },
    });
    if (data.customIndustryName) {
      await tx.customIndustry.create({
        data: {
          tenantId: tenant.id,
          name: data.customIndustryName,
          description: data.customIndustryDescription,
        },
      });
    }
    return { user, tenant };
  });

  await recordAuditEvent({
    tenantId: result.tenant.id,
    userId: result.user.id,
    action: "auth.register",
    entityType: "User",
    entityId: result.user.id,
    summary: `Registered ${result.user.email} and created organization ${result.tenant.slug}`,
  });

  return {
    userId: result.user.id,
    tenantId: result.tenant.id,
    email: result.user.email,
  };
}

// ---------------------------------------------------------------------------
// Sign-in
// ---------------------------------------------------------------------------

export async function verifyCredentials(input: unknown, meta: { ip?: string | null }) {
  const data = signInSchema.parse(input);
  const email = data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  // Constant-ish response: same error for unknown email or bad password.
  if (!user || !user.passwordHash || !user.isActive) {
    await recordAuditEvent({
      userId: user?.id ?? null,
      action: "auth.signin_failed",
      entityType: "User",
      entityId: user?.id ?? null,
      severity: "WARNING",
      summary: `Failed sign-in for ${email}`,
      ip: meta.ip,
    });
    throw ApiError.unauthorized("Invalid email or password");
  }

  const ok = await verifyPassword(data.password, user.passwordHash);
  if (!ok) {
    await recordAuditEvent({
      userId: user.id,
      action: "auth.signin_failed",
      entityType: "User",
      entityId: user.id,
      severity: "WARNING",
      summary: `Failed sign-in for ${email}`,
      ip: meta.ip,
    });
    throw ApiError.unauthorized("Invalid email or password");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await recordAuditEvent({
    userId: user.id,
    action: "auth.signin",
    entityType: "User",
    entityId: user.id,
    summary: `Signed in: ${email}`,
    ip: meta.ip,
  });

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id, isActive: true, tenant: { isActive: true } },
    select: {
      tenantId: true,
      role: true,
      tenant: { select: { name: true, slug: true, industryKey: true } },
    },
  });

  return { userId: user.id, email: user.email, memberships };
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

export async function inviteMember(
  input: unknown,
  ctx: { tenantId: string; userId: string; actorRole: MemberRole },
) {
  const data = inviteMemberSchema.parse(input);
  const email = data.email.toLowerCase();

  const existingMember = await prisma.membership.findFirst({
    where: { tenantId: ctx.tenantId, user: { email } },
  });
  if (existingMember) throw ApiError.conflict("This person is already a member");

  const pending = await prisma.invitation.findFirst({
    where: { tenantId: ctx.tenantId, email, status: "PENDING" },
  });
  if (pending) throw ApiError.conflict("An invitation is already pending for this email");

  const { token, tokenHash } = generateOpaqueToken();
  const invitation = await prisma.invitation.create({
    data: {
      tenantId: ctx.tenantId,
      email,
      role: data.role,
      tokenHash,
      invitedById: ctx.userId,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    },
  });

  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "org.invitation.create",
    entityType: "Invitation",
    entityId: invitation.id,
    summary: `Invited ${email} as ${data.role}`,
  });

  // In production the token is delivered by email only. Dev/test returns it.
  return {
    invitationId: invitation.id,
    email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    ...(process.env.NODE_ENV !== "production" ? { token } : {}),
  };
}

export async function acceptInvitation(input: unknown, meta: { ip?: string | null }) {
  const data = acceptInvitationSchema.parse(input);
  const tokenHash = hashToken(data.token);

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash },
    include: { tenant: { select: { id: true, isActive: true } } },
  });
  if (!invitation || invitation.status !== "PENDING") {
    throw ApiError.notFound("Invitation not found or no longer valid");
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
    throw ApiError.notFound("Invitation has expired");
  }
  if (!invitation.tenant.isActive) throw ApiError.forbidden("Organization is inactive");

  const passwordHash = await hashPassword(data.password);
  const email = invitation.email;

  const user = await prisma.$transaction(async (tx) => {
    let existing = await tx.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.passwordHash) {
        throw ApiError.conflict(
          "An account already exists for this email — sign in first, then accept the invitation",
        );
      }
      existing = await tx.user.update({
        where: { id: existing.id },
        data: { passwordHash, name: existing.name ?? data.name, isVerified: true },
      });
    } else {
      existing = await tx.user.create({
        data: { email, name: data.name, passwordHash, isVerified: true },
      });
    }
    await tx.membership.upsert({
      where: { userId_tenantId: { userId: existing.id, tenantId: invitation.tenantId } },
      create: { userId: existing.id, tenantId: invitation.tenantId, role: invitation.role },
      update: { isActive: true },
    });
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
    return existing;
  });

  await recordAuditEvent({
    tenantId: invitation.tenantId,
    userId: user.id,
    action: "org.invitation.accept",
    entityType: "Invitation",
    entityId: invitation.id,
    summary: `${user.email} accepted invitation and joined as ${invitation.role}`,
    ip: meta.ip,
  });

  return { userId: user.id, tenantId: invitation.tenantId, role: invitation.role };
}

export async function revokeInvitation(
  invitationId: string,
  ctx: { tenantId: string; userId: string },
) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, tenantId: ctx.tenantId },
  });
  if (!invitation) throw ApiError.notFound("Invitation not found");
  if (invitation.status !== "PENDING") throw ApiError.conflict("Invitation is not pending");
  await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "REVOKED" } });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "org.invitation.revoke",
    entityType: "Invitation",
    entityId: invitation.id,
    summary: `Revoked invitation for ${invitation.email}`,
  });
  return { revoked: true };
}

export async function listMembers(tenantId: string) {
  const members = await prisma.membership.findMany({
    where: { tenantId },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const invitations = await prisma.invitation.findMany({
    where: { tenantId, status: "PENDING" },
    select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return {
    members: members.map((m) => ({
      membershipId: m.id,
      role: m.role,
      isActive: m.isActive,
      joinedAt: m.createdAt,
      user: m.user,
    })),
    pendingInvitations: invitations,
  };
}

/** Change a member's role. Only ADMIN may change roles; cannot demote self out of last admin. */
export async function updateMemberRole(
  membershipId: string,
  role: MemberRole,
  ctx: { tenantId: string; userId: string },
) {
  const target = await prisma.membership.findFirst({
    where: { id: membershipId, tenantId: ctx.tenantId },
    include: { user: { select: { email: true } } },
  });
  if (!target) throw ApiError.notFound("Member not found");

  const adminsCount = await prisma.membership.count({
    where: { tenantId: ctx.tenantId, role: "ADMIN", isActive: true },
  });
  if (target.role === "ADMIN" && role !== "ADMIN" && adminsCount <= 1 && target.userId === ctx.userId) {
    throw ApiError.conflict("You are the last administrator and cannot remove your own admin role");
  }

  const updated = await prisma.membership.update({
    where: { id: target.id },
    data: { role },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "org.member.role_update",
    entityType: "Membership",
    entityId: target.id,
    severity: "CRITICAL",
    summary: `Changed role of ${target.user.email} to ${role}`,
  });
  return { membershipId: updated.id, role: updated.role };
}
