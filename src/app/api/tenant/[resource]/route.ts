import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi, serialise } from "@/lib/api/tenant";
import {
  handleWriteError,
  isServiceError,
} from "@/lib/api/write-errors";
import { isResourceKey, permissionCode, RESOURCES } from "@/lib/resources/registry";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { createRecord, listRecords } from "@/server/services/tenant/records.service";
import {
  isCrmResource,
  processCrmWrite,
} from "@/server/services/crm/events.service";

/** Lists tenant-scoped records with search, filtering, sorting and pagination. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource } = await params;
  if (!isResourceKey(resource)) return jsonError(404, "Unknown resource.");

  const definition = RESOURCES[resource];
  const auth = await requireTenantApi(permissionCode(definition.permissionResource, "READ"));
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const statusParam = searchParams.get("status");

  if (
    statusParam &&
    definition.statusField &&
    !definition.statusField.options.some((option) => option.value === statusParam)
  ) {
    return jsonError(400, "That filter value is not supported.");
  }

  try {
    const result = await listRecords({
      key: resource,
      tenantId: auth.tenantId,
      page,
      limit,
      q: searchParams.get("q")?.trim() || undefined,
      status: statusParam ?? undefined,
      sort: searchParams.get("sort") ?? definition.defaultSort,
    });

    return Response.json({
      records: serialise(result.items),
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.max(1, Math.ceil(result.total / limit)),
      },
    });
  } catch (error) {
    console.error(`List ${resource} error:`, error);
    return jsonError(500, "Unable to load records.");
  }
}

/** Creates one tenant-scoped record. The tenant always comes from the session. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource } = await params;
  if (!isResourceKey(resource)) return jsonError(404, "Unknown resource.");

  const definition = RESOURCES[resource];
  if (!definition.allowCreate) {
    return jsonError(403, "This record type cannot be created from the workspace.");
  }

  const auth = await requireTenantApi(
    definition.createPermission ??
      permissionCode(definition.permissionResource, "CREATE"),
  );
  if (auth.error) return auth.error;

  const parsed = await request.json().catch(() => null);
  if (parsed === null) return jsonError(400, "Provide a request body.");

  try {
    const record = await createRecord({
      key: resource,
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      input: parsed,
    });

    if (isServiceError(record)) return jsonError(409, record.error);

    if (isCrmResource(resource)) {
      await processCrmWrite({
        key: resource,
        tenantId: auth.tenantId,
        actorId: auth.actor.id,
        id: record.id,
        created: true,
        previous: null,
      });
    }

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.CREATE,
      resource: resource.replace(/-/g, "_"),
      resourceId: record.id,
      ...requestMeta(request),
      metadata: { module: definition.module },
    });

    return Response.json({ record: serialise(record) }, { status: 201 });
  } catch (error) {
    return handleWriteError(error, resource);
  }
}
