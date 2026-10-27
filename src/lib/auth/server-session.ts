import { requireAuthenticatedUser, resolveSessionIdentity } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";

export const dynamic = "force-dynamic";

/** Server Component session resolver shared by the workspace pages. */
export async function getSessionContext() {
  const user = await resolveSessionIdentity();
  if (!user) return null;
  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  return { user, platformAdmin: account?.role === "PLATFORM_ADMIN" };
}

export { requireAuthenticatedUser };
