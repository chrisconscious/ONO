"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  ShieldXIcon,
} from "lucide-react";
import type { AuthTokenStatus } from "@/lib/auth/tokens";
import { resetPasswordSchema } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordChecklist } from "@/components/auth/password-checklist";

type ResetResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  redirectTo?: string;
};

const invalidCopy: Record<Exclude<AuthTokenStatus, "valid">, string> = {
  invalid: "This password reset link is not valid.",
  expired: "This password reset link has expired.",
  used: "This password reset link has already been used.",
};

export function ResetPasswordForm({
  token,
  status = "valid",
}: {
  token: string;
  status?: AuthTokenStatus;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [result, setResult] = useState<ResetResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = resetPasswordSchema.safeParse({
      token,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const errors: typeof fieldErrors = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "password") errors.password = issue.message;
        if (issue.path[0] === "confirmPassword") {
          errors.confirmPassword = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: parsed.data.token,
          password: parsed.data.password,
          confirmPassword: parsed.data.confirmPassword,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as ResetResponse;

      if (!response.ok) {
        setFormError(data.error ?? "The password could not be updated.");
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
      <div id="reset-password-form" className="flex flex-col gap-5" aria-live="polite">
        <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Password updated
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {result.message ??
              "Your password was changed. Existing sessions were signed out."}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/sign-in?reason=password-reset" />}
          size="lg"
          className="h-10 w-full"
        >
          Sign in with your new password
        </Button>
      </div>
    );
  }

  if (status !== "valid") {
    return (
      <div id="reset-password-form" className="flex flex-col gap-5">
        <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldXIcon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            This link cannot be used
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {invalidCopy[status]}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/forgot-password" />}
          size="lg"
          className="h-10 w-full"
        >
          Request a new reset link
        </Button>
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
    <form
      id="reset-password-form"
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6"
      aria-describedby={formError ? "reset-error" : undefined}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.7rem]">
          Choose a new password
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This link can be used once. Signing in again is required afterwards.
        </p>
      </div>

      {formError ? (
        <div
          id="reset-error"
          role="alert"
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          {formError}{" "}
          <Link
            href="/forgot-password"
            className="font-medium underline underline-offset-4"
          >
            Request a new link
          </Link>
        </div>
      ) : null}

      <div className="flex flex-col gap-5">
        <Field data-invalid={Boolean(fieldErrors.password)}>
          <FieldLabel htmlFor="reset-password">New password</FieldLabel>
          <div className="relative">
            <Input
              id="reset-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby="reset-password-policy"
              disabled={isSubmitting}
              className="pr-10"
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" aria-hidden="true" />
              ) : (
                <EyeIcon className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <PasswordChecklist id="reset-password-policy" value={password} />
          {fieldErrors.password ? (
            <FieldError>{fieldErrors.password}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.confirmPassword)}>
          <FieldLabel htmlFor="reset-confirm">Confirm new password</FieldLabel>
          <Input
            id="reset-confirm"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            disabled={isSubmitting}
            required
          />
          {fieldErrors.confirmPassword ? (
            <FieldError>{fieldErrors.confirmPassword}</FieldError>
          ) : null}
        </Field>
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-10 w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
            Updating password
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  );
}
