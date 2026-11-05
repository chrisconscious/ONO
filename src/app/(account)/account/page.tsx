import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Account settings live on a single canonical page. */
export default function AccountPage() {
  redirect("/account/security");
}
