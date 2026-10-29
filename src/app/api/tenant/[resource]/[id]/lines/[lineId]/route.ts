import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi, serialise } from "@/lib/api/tenant";
import { handleWriteError } from "@/lib/api/write-errors";
import { isDocumentKey } from "@/lib/resources/documents";
import { isResourceKey, permissionCode, RESOURCES } from "@/lib/resources/registry";
import { createAuditLog } from "@/server/services/audit/audit.service";
import {
  deleteDocumentLine,
  updateDocumentLine,
} from "@/server/services/tenant/document-lines.service";

function resolveDocument(resource: string) {
  if (!isResourceKey(resource) || !isDocumentKey(resource)) return null;
  return { key: resource, definition: RESOURCES[resource] };
}

/** Updates one line item and recalculates the parent totals. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string; lineId: string }> },
) {
  const { resource, id, lineId } = await params;
  const document = resolveDocument(resource);
  if (!document) return jsonError(404, "Unknown document type.");

  const auth = await requireTenantApi(
    document.definition.updatePermission ??
      permissionCode(document.definition.permissionResource, "UPDATE"),
  );
  if (auth.error) return auth.error;

  const parsed = await request.json().catch(() => null);
  if (parsed === null) return jsonError(400, "Provide a request body.");

  try {
    const result = await updateDocumentLine({
      key: document.key,
      tenantId: auth.tenantId,
      documentId: id,
      lineId,
      input: parsed,
    });

    if ("error" in result) return jsonError(409, result.error);

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.UPDATE,
      resource: `${resource.replace(/-/g, "_")}_line`,
      resourceId: lineId,
      ...requestMeta(request),
      metadata: { module: document.definition.module, documentId: id },
    });

    return Response.json({ document: serialise(result.detail) });
  } catch (error) {
    return handleWriteError(error, `${resource} line`);
  }
}

/** Removes one line item and recalculates the parent totals. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string; lineId: string }> },
) {
  const { resource, id, lineId } = await params;
  const document = resolveDocument(resource);
  if (!document) return jsonError(404, "Unknown document type.");

  const auth = await requireTenantApi(
    document.definition.updatePermission ??
      permissionCode(document.definition.permissionResource, "UPDATE"),
  );
  if (auth.error) return auth.error;

  try {
    const result = await deleteDocumentLine({
      key: document.key,
      tenantId: auth.tenantId,
      documentId: id,
      lineId,
    });

    if ("error" in result) return jsonError(409, result.error);

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.DELETE,
      resource: `${resource.replace(/-/g, "_")}_line`,
      resourceId: lineId,
      ...requestMeta(request),
      metadata: { module: document.definition.module, documentId: id },
    });

    return Response.json({ document: serialise(result.detail) });
  } catch (error) {
    return handleWriteError(error, `${resource} line`);
  }
}
