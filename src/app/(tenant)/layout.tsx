import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/server-session";
import { AppShell } from "@/components/shared/app-shell";

/**
 * Tenant workspace layout. Requires an authenticated session; the shell then
 * resolves memberships/permissions client-side against server data. Page
 * content remains usable even before a workspace is selected because the
 * shell renders a selection state (no fake data is ever shown).
 */
export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
