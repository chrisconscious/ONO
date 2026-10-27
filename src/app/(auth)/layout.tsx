import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/server-session";

/**
 * Authentication-area layout. Authenticated users are redirected into their
 * workspace so they never see auth screens again. This is a usability gate
 * only — every API route independently enforces the session server-side.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();
  if (session) redirect("/dashboard");
  return <>{children}</>;
}
