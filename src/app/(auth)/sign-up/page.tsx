import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/session";
import { resolvePostAuthDestination } from "@/lib/auth/destination";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your ONO account.",
};

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const actor = await getCurrentActor();
  if (actor) redirect(resolvePostAuthDestination(actor, undefined));

  return (
    <AuthShell formId="sign-up-form" skipLabel="Skip to sign-up form">
      <SignUpForm />
    </AuthShell>
  );
}
