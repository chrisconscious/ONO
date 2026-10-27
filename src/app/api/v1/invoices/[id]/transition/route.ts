import { ApiError } from "@/lib/api/errors";
import { ok, readJsonBody, withTenant } from "@/lib/api/tenant-route";
import * as finance from "@/server/services/finance-service";
import type { InvoiceStatus } from "@prisma/client";

const ALLOWED_TARGETS: ReadonlySet<string> = new Set([
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "VOID",
]);

/**
 * Explicit invoice lifecycle transition endpoint. State-machine legality is
 * enforced by the service under a row lock; this layer only validates the
 * requested target is a known status to keep error codes clean.
 */
export const POST = withTenant(async ({ ctx, params, request }) => {
  const body = (await readJsonBody(request)) as { to?: unknown };
  if (typeof body.to !== "string" || !ALLOWED_TARGETS.has(body.to)) {
    throw ApiError.validation(`to must be one of: ${[...ALLOWED_TARGETS].join(", ")}`);
  }
  return ok(await finance.transitionInvoice(params.id, body.to as InvoiceStatus, ctx));
}, { permission: "finance.write" });
