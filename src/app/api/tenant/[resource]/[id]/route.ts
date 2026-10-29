import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi, serialise } from "@/lib/api/tenant";
import { isResourceKey, permissionCode, RESOURCES } from "@/lib/resources/registry";
import { createAuditLog } from "@/server/services/audit/audit.service";
import { deleteRecord, updateRecord } from "@/server/services/tenant/records.service";
import {
  isCrmResource,
  processCrmWrite,
  readCrmSnapshot,
} from "@/server/services/crm/events.service";
import {
  handleWriteError,
  isServiceError,
} from "@/lib/api/write-errors";

/** Updates a tenant-scoped record after re-checking ownership and permission. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> },
) {
  const { resource, id } = await params;
  if (!isResourceKey(resource)) return jsonError(404, "Unknown resource.");

  const definition = RESOURCES[resource];
  if (!definition.allowUpdate) {
    return jsonError(403, "This record type is immutable.");
  }

  const auth = await requireTenantApi(
    definition.updatePermission ??
      permissionCode(definition.permissionResource, "UPDATE"),
  );
  if (auth.error) return auth.error;

  const parsed = await request.json().catch(() => null);
  if (parsed === null) return jsonError(400, "Provide a request body.");

  try {
    const previous = isCrmResource(resource)
      ? await readCrmSnapshot(resource, auth.tenantId, id)
      : null;

    const record = await updateRecord({
      key: resource,
      tenantId: auth.tenantId,
      id,
      input: parsed,
    });

    if (isServiceError(record)) return jsonError(409, record.error);

    if (isCrmResource(resource)) {
      await processCrmWrite({
        key: resource,
        tenantId: auth.tenantId,
        actorId: auth.actor.id,
        id: record.id,
        created: false,
        previous,
      });
    }

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.UPDATE,
      resource: resource.replace(/-/g, "_"),
      resourceId: record.id,
      ...requestMeta(request),
      metadata: { module: definition.module },
    });

    return Response.json({ record: serialise(record) });
  } catch (error) {
    return handleWriteError(error, resource);
  }
}

/** Deletes a tenant-scoped record where the module allows deletion. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> },
) {
  const { resource, id } = await params;
  if (!isResourceKey(resource)) return jsonError(404, "Unknown resource.");

  const definition = RESOURCES[resource];
  if (!definition.allowDelete) {
    return jsonError(403, "This record type cannot be deleted.");
  }

  const auth = await requireTenantApi(permissionCode(definition.permissionResource, "DELETE"));
  if (auth.error) return auth.error;

  try {
    const result = await deleteRecord({ key: resource, tenantId: auth.tenantId, id });
    if (isServiceError(result)) return jsonError(409, result.error);

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.DELETE,
      resource: resource.replace(/-/g, "_"),
      resourceId: id,
      ...requestMeta(request),
      metadata: { module: definition.module },
    });

    return Response.json({ deleted: true });
  } catch (error) {
    return handleWriteError(error, resource);
  }
}
