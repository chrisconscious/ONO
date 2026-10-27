import { ApiError } from "@/lib/api/errors";
import { ok, readJsonBody, withTenant } from "@/lib/api/tenant-route";
import * as finance from "@/server/services/finance-service";

/**
 * Recording a payment is transactional and row-locked inside the service so
 * concurrent or retried requests cannot double-allocate against an invoice.
 */
export const POST = withTenant(async ({ ctx, params, request }) => {
  const raw = (await readJsonBody(request)) as Record<string, unknown>;
  // The invoice ID comes from the path only — never from the body — so a
  // client cannot redirect a payment onto another invoice.
  const body = { ...raw, invoiceId: params.id };
  if (typeof body.invoiceId !== "string") throw ApiError.validation("Invalid invoice id");
  return ok(await finance.recordPayment(body, ctx), 201);
}, { permission: "finance.write" });
