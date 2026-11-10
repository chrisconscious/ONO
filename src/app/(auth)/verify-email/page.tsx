import type { Metadata } from "next";
import { peekAuthToken } from "@/lib/auth/tokens";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Confirm the email address for your ONO account.",
};

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string; mode?: string }>;
}) {
  const { token, email, mode } = await searchParams;
  // Reading the token is safe: it is not consumed until the visitor presses
  // the verification button, so mail scanners cannot verify an address.
  const status = token
    ? await peekAuthToken(token, "EMAIL_VERIFICATION")
    : "invalid";

  return (
    <AuthShell formId="verify-email-form" skipLabel="Skip to verification">
      <VerifyEmailForm
        token={token}
        email={email}
        status={status}
        emailChange={mode === "change"}
      />
    </AuthShell>
  );
}
