import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** The profile is the canonical landing page for account management. */
export default function AccountPage() {
  redirect("/account/profile");
}
