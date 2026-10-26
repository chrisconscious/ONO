import { prisma } from "@/lib/database/prisma";
import { ApiError } from "@/lib/api/errors";
import { recordAuditEvent } from "@/server/services/audit-service";
import type { TenantContext } from "@/lib/auth/session";
import { upsertIntegrationSchema } from "@/lib/validation/schemas";

// ---------------------------------------------------------------------------
// Notifications (in-app records; delivery history is the row itself)
// ---------------------------------------------------------------------------

export async function createNotification(
  args: { userId: string; title: string; body?: string; link?: string },
  ctx: TenantContext,
) {
  // Recipient must be a member of the same tenant.
  const m = await prisma.membership.findFirst({
    where: { userId: args.userId, tenantId: ctx.tenantId, isActive: true },
  });
  if (!m) throw ApiError.validation("Recipient is not an active member of this organization");
  return prisma.notification.create({
    data: {
      tenantId: ctx.tenantId,
      userId: args.userId,
      title: args.title,
      body: args.body,
      link: args.link,
    },
  });
}

export async function listNotifications(ctx: TenantContext, onlyUnread: boolean) {
  return prisma.notification.findMany({
    where: {
      tenantId: ctx.tenantId,
      userId: ctx.user.id,
      ...(onlyUnread ? { status: "UNREAD" } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function markNotificationRead(notificationId: string, ctx: TenantContext) {
  const n = await prisma.notification.findFirst({
    where: { id: notificationId, tenantId: ctx.tenantId, userId: ctx.user.id },
  });
  if (!n) throw ApiError.notFound("Notification not found");
  return prisma.notification.update({ where: { id: n.id }, data: { status: "READ" } });
}

// ---------------------------------------------------------------------------
// Document metadata — files live in object storage addressed by opaque keys.
// The API layer enforces tenant + privacy checks before returning any key.
// ---------------------------------------------------------------------------

export async function registerDocument(
  args: {
    name: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: bigint;
    entityType?: string;
    entityId?: string;
    isPrivate?: boolean;
  },
  ctx: TenantContext,
) {
  const existing = await prisma.document.findUnique({ where: { storageKey: args.storageKey } });
  if (existing) throw ApiError.conflict("Storage key already registered");
  const doc = await prisma.document.create({
    data: {
      tenantId: ctx.tenantId,
      name: args.name,
      storageKey: args.storageKey,
      mimeType: args.mimeType,
      sizeBytes: args.sizeBytes,
      entityType: args.entityType,
      entityId: args.entityId,
      uploadedByUserId: ctx.user.id,
      isPrivate: args.isPrivate ?? true,
    },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "documents.register",
    entityType: "Document",
    entityId: doc.id,
    summary: `Document '${doc.name}' registered`,
  });
  return doc;
}

/** Metadata listing scoped to tenant; private docs visible only to uploader+admins. */
export async function listDocuments(filter: { entityType?: string; entityId?: string }, ctx: TenantContext) {
  const docs = await prisma.document.findMany({
    where: {
      tenantId: ctx.tenantId,
      entityType: filter.entityType,
      entityId: filter.entityId,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const isAdmin = ctx.permissions.has("org.update");
  return docs
    .filter((d) => !d.isPrivate || isAdmin || d.uploadedByUserId === ctx.user.id)
    .map((d) => ({
      id: d.id,
      name: d.name,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes.toString(),
      entityType: d.entityType,
      entityId: d.entityId,
      isPrivate: d.isPrivate,
      createdAt: d.createdAt,
      // storageKey intentionally NOT exposed in listings.
    }));
}

/**
 * Authorization gate for fetching the actual file. Returns the storage key
 * only when the caller may access it; route uses this to stream from storage.
 */
export async function authorizeDocumentAccess(documentId: string, ctx: TenantContext): Promise<string> {
  const doc = await prisma.document.findFirst({ where: { id: documentId, tenantId: ctx.tenantId } });
  if (!doc) throw ApiError.notFound("Document not found");
  const isAdmin = ctx.permissions.has("org.update");
  if (doc.isPrivate && !isAdmin && doc.uploadedByUserId !== ctx.user.id) {
    throw ApiError.forbidden("You do not have access to this document");
  }
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "documents.access",
    entityType: "Document",
    entityId: doc.id,
    summary: `Document '${doc.name}' accessed`,
  });
  return doc.storageKey;
}

// ---------------------------------------------------------------------------
// Integrations — secrets are stored as references (secretRef), never plaintext.
// ---------------------------------------------------------------------------

export async function upsertIntegration(input: unknown, ctx: TenantContext) {
  const data = upsertIntegrationSchema.parse(input);
  // Reject plaintext secret-looking config keys defensively.
  const cfg = (data.config ?? {}) as Record<string, unknown>;
  for (const key of Object.keys(cfg)) {
    if (/secret|token|password|apikey|api_key/i.test(key)) {
      throw ApiError.validation(`Config key '${key}' looks like a secret; use the encrypted secret store instead`);
    }
  }
  const integration = await prisma.integrationConfig.upsert({
    where: { tenantId_provider: { tenantId: ctx.tenantId, provider: data.provider } },
    create: { tenantId: ctx.tenantId, provider: data.provider, status: data.status, config: data.config as never },
    update: { status: data.status, config: data.config as never },
  });
  await recordAuditEvent({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    membershipId: ctx.membershipId,
    action: "integrations.upsert",
    entityType: "IntegrationConfig",
    entityId: integration.id,
    severity: "WARNING",
    summary: `Integration '${data.provider}' set to ${data.status}`,
  });
  return { id: integration.id, provider: integration.provider, status: integration.status, config: integration.config };
}

export async function listIntegrations(ctx: TenantContext) {
  const rows = await prisma.integrationConfig.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { provider: "asc" },
  });
  // Never expose secretRef values.
  return rows.map((r) => ({ id: r.id, provider: r.provider, status: r.status, config: r.config, hasSecret: Boolean(r.secretRef) }));
}

// ---------------------------------------------------------------------------
// Idempotency — external events processed at-most-once per (tenant, key).
// ---------------------------------------------------------------------------

export async function runIdempotent<T>(
  key: string,
  ctx: TenantContext,
  work: () => Promise<T>,
): Promise<{ result: T; replayed: false } | { result: undefined; replayed: true }> {
  const created = await prisma.idempotencyRecord.create({
    data: { tenantId: ctx.tenantId, key: `${ctx.tenantId}:${key}` },
  }).catch(() => null);
  if (!created) {
    // Duplicate delivery: record exists -> skip side effects.
    return { result: undefined, replayed: true };
  }
  try {
    const result = await work();
    await prisma.idempotencyRecord.update({ where: { id: created.id }, data: { completedAt: new Date() } });
    return { result, replayed: false };
  } catch (err) {
    // Failed processing must allow retry: remove the claim.
    await prisma.idempotencyRecord.delete({ where: { id: created.id } }).catch(() => undefined);
    throw err;
  }
}
