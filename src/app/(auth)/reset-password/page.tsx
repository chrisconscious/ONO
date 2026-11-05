import type { Metadata } from "next";
import { peekAuthToken } from "@/lib/auth/tokens";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your ONO account.",
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const status = token
    ? await peekAuthToken(token, "PASSWORD_RESET")
    : "invalid";

  return (
    <AuthShell formId="reset-password-form" skipLabel="Skip to password form">
      <ResetPasswordForm token={token ?? ""} status={status} />
    </AuthShell>
  );
}
