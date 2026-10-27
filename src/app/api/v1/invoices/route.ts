import { ok, readJsonBody, withTenant } from "@/lib/api/tenant-route";
import * as finance from "@/server/services/finance-service";

export const GET = withTenant(async ({ ctx, request }) => {
  // Receivables/payables summaries are cheap aggregates; direction selects the view.
  const direction = new URL(request.url).searchParams.get("direction");
  if (direction === "payable") return ok(await finance.getPayables(ctx));
  return ok(await finance.getReceivables(ctx));
}, { permission: "finance.read" });

export const POST = withTenant(async ({ ctx, request }) => {
  const body = await readJsonBody(request);
  return ok(await finance.createInvoice(body, ctx), 201);
}, { permission: "finance.write" });
