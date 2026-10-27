import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/server-session";

/**
 * Platform administration layout gate. Redirects non-platform users out of
 * /admin entirely. IMPORTANT: this is defense-in-depth only — every platform
 * API route independently calls requirePlatformAdmin(), which re-reads the
 * role from the database per request. The frontend never grants privileges.
 */
export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");
  if (!session.platformAdmin) redirect("/dashboard");
  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm tracking-wide uppercase text-muted-foreground">
            ClickIT Platform Administration
          </span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <a href="/admin/overview" className="hover:underline">Overview</a>
          <a href="/admin/testimonials" className="hover:underline">Testimonials</a>
          <a href="/dashboard" className="hover:underline text-muted-foreground">Tenant workspace</a>
        </nav>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
