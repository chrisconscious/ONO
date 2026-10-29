import type { NextRequest } from "next/server";
import { AuditAction } from "@prisma/client";
import { jsonError, requestMeta } from "@/lib/auth/api";
import { requireTenantApi, serialise } from "@/lib/api/tenant";
import { handleWriteError } from "@/lib/api/write-errors";
import { isDocumentKey } from "@/lib/resources/documents";
import { isResourceKey, permissionCode, RESOURCES } from "@/lib/resources/registry";
import { createAuditLog } from "@/server/services/audit/audit.service";
import {
  addDocumentLine,
  getDocument,
} from "@/server/services/tenant/document-lines.service";

function resolveDocument(resource: string) {
  if (!isResourceKey(resource) || !isDocumentKey(resource)) return null;
  return { key: resource, definition: RESOURCES[resource] };
}

/** Lists a document and its line items for the active workspace. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> },
) {
  const { resource, id } = await params;
  const document = resolveDocument(resource);
  if (!document) return jsonError(404, "Unknown document type.");

  const auth = await requireTenantApi(
    permissionCode(document.definition.permissionResource, "READ"),
  );
  if (auth.error) return auth.error;

  try {
    const detail = await getDocument(document.key, auth.tenantId, id);
    if (!detail) return jsonError(404, "Document not found in this workspace.");
    return Response.json({ document: serialise(detail) });
  } catch (error) {
    console.error(`Load ${resource} lines error:`, error);
    return jsonError(500, "Unable to load the document.");
  }
}

/** Adds a line item, then recalculates the document totals on the server. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> },
) {
  const { resource, id } = await params;
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
    const result = await addDocumentLine({
      key: document.key,
      tenantId: auth.tenantId,
      documentId: id,
      input: parsed,
    });

    if ("error" in result) return jsonError(409, result.error);
    const detail = result.detail;

    await createAuditLog({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      action: AuditAction.CREATE,
      resource: `${resource.replace(/-/g, "_")}_line`,
      resourceId: id,
      ...requestMeta(request),
      metadata: { module: document.definition.module },
    });

    return Response.json({ document: serialise(detail) }, { status: 201 });
  } catch (error) {
    return handleWriteError(error, `${resource} line`);
  }
}
