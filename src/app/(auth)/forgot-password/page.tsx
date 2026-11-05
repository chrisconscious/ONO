import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a password reset link for your ONO account.",
};

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <AuthShell formId="forgot-password-form" skipLabel="Skip to password form">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
