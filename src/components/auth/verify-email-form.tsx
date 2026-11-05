"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2Icon,
  Loader2Icon,
  MailCheckIcon,
  ShieldXIcon,
} from "lucide-react";
import type { AuthTokenStatus } from "@/lib/auth/tokens";
import { Button } from "@/components/ui/button";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

type VerifyResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  email?: string;
  redirectTo?: string;
};

const invalidCopy: Record<Exclude<AuthTokenStatus, "valid">, string> = {
  invalid: "This verification link is not valid.",
  used: "This verification link has already been used.",
  expired: "This verification link has expired.",
};

export function VerifyEmailForm({
  token,
  email,
  status,
}: {
  token?: string;
  email?: string;
  status: AuthTokenStatus;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [verifiedEmail, setVerifiedEmail] = useState<string | undefined>(email);
  const [verified, setVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await response.json().catch(() => ({}))) as VerifyResponse;

      if (!response.ok) {
        setError(data.error ?? "The email address could not be verified.");
        setCurrentStatus("invalid");
        return;
      }

      setVerifiedEmail(data.email ?? email);
      setVerified(true);
      setCurrentStatus("used");
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (verified) {
    return (
      <div id="verify-email-form" className="flex flex-col gap-5" aria-live="polite">
        <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Email verified
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {verifiedEmail ? (
              <>
                <span className="font-medium text-foreground">{verifiedEmail}</span>{" "}
                is confirmed. You can sign in now.
              </>
            ) : (
              "Your email address is confirmed. You can sign in now."
            )}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/sign-in?reason=verified" />}
          size="lg"
          className="h-10 w-full"
        >
          Continue to sign in
        </Button>
      </div>
    );
  }

  if (currentStatus !== "valid") {
    return (
      <div id="verify-email-form" className="flex flex-col gap-5">
        <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldXIcon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            This link cannot be used
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {error ?? invalidCopy[currentStatus as Exclude<AuthTokenStatus, "valid">]}
            {email ? (
              <>
                {" "}
                Request a new link for{" "}
                <span className="font-medium text-foreground">{email}</span>.
              </>
            ) : (
              " Enter your email to request a new verification link."
            )}
          </p>
        </div>

        <ResendVerificationForm email={email} />

        <p className="border-t border-border pt-5 text-sm text-muted-foreground">
          <Link
            href="/sign-in"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div id="verify-email-form" className="flex flex-col gap-5">
      <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MailCheckIcon className="size-5" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Confirm your email address
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {email ? (
            <>
              Confirm that{" "}
              <span className="font-medium text-foreground">{email}</span> belongs
              to you. This link works once and expires after 24 hours.
            </>
          ) : (
            "Confirm that this email address belongs to you. This link works once."
          )}
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <Button size="lg" className="h-10 w-full" disabled={isSubmitting} onClick={verify}>
        {isSubmitting ? (
          <>
            <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
            Verifying
          </>
        ) : (
          "Verify email address"
        )}
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Opening this page does not verify the address by itself. The button above
        consumes the token, which prevents link scanners and accidental clicks
        from completing verification.
      </p>
    </div>
  );
}
