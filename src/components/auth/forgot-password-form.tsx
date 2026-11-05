"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2Icon, MailCheckIcon } from "lucide-react";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type ForgotResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  emailDelivery?: "sent" | "unavailable";
  devResetUrl?: string;
};

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<ForgotResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email }),
      });
      const data = (await response.json().catch(() => ({}))) as ForgotResponse;

      if (!response.ok) {
        setFormError(
          data.error ?? "Password recovery is unavailable. Please try again.",
        );
        return;
      }

      setResult(data);
    } catch {
      setFormError(
        "We could not reach the server. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result) {
    return (
      <div id="forgot-password-form" className="flex flex-col gap-5" aria-live="polite">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheckIcon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Check your email
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {result.message ??
              "If an account exists for that email, a reset link has been sent."}
          </p>
        </div>

        {result.emailDelivery === "unavailable" ? (
          <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-foreground">
            Email delivery is not configured in this environment. Contact your
            administrator if you cannot access the account.
          </p>
        ) : null}

        {result.devResetUrl ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">
              Development only: email transport is console
            </p>
            <Link
              href={result.devResetUrl.replace(/^https?:\/\/[^/]+/, "")}
              className="mt-1 block break-all text-primary underline underline-offset-4"
            >
              Open the reset link
            </Link>
          </div>
        ) : null}

        <Button
          nativeButton={false}
          render={<Link href="/sign-in" />}
          variant="outline"
          size="lg"
          className="h-10 w-full"
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form
      id="forgot-password-form"
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6"
      aria-describedby={formError ? "forgot-error" : undefined}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.7rem]">
          Reset your password
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Enter your account email and we will send a single-use reset link. The
          response is the same whether or not the address exists.
        </p>
      </div>

      {formError ? (
        <div
          id="forgot-error"
          role="alert"
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          {formError}
        </div>
      ) : null}

      <Field data-invalid={Boolean(formError)}>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(formError)}
          disabled={isSubmitting}
          autoFocus
          required
        />
        <FieldError>{formError}</FieldError>
      </Field>

      <Button
        type="submit"
        size="lg"
        className="h-10 w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
            Sending link
          </>
        ) : (
          "Send reset link"
        )}
      </Button>

      <p className="border-t border-border pt-5 text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
