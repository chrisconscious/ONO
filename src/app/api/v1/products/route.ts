import { ok, readJsonBody, withTenant } from "@/lib/api/tenant-route";
import * as inventory from "@/server/services/inventory-service";

export const GET = withTenant(async ({ ctx, request }) => {
  const search = request.nextUrl.searchParams.get("search") ?? undefined;
  return ok(await inventory.listProducts({ search }, ctx));
}, { permission: "inventory.read" });

export const POST = withTenant(async ({ ctx, request }) => {
  const body = await readJsonBody(request);
  return ok(await inventory.createProduct(body, ctx), 201);
}, { permission: "inventory.write" });
