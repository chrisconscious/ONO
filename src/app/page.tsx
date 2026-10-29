import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

/** Entry point: sends visitors to the console that matches their real access. */
export default async function HomePage() {
  const actor = await getCurrentActor();

  if (!actor) redirect("/login");
  if (actor.memberships.length > 0) redirect("/app");
  if (actor.isPlatformAdmin) redirect("/admin");
  redirect("/access-denied?scope=workspace");
}
