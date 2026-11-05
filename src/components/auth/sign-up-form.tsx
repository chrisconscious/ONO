"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  MailCheckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signUpSchema } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordChecklist } from "@/components/auth/password-checklist";

type RegisterResponse = {
  ok?: boolean;
  email?: string;
  message?: string;
  error?: string;
  details?: Record<string, string[] | undefined>;
  emailDelivery?: "sent" | "unavailable";
  devVerificationUrl?: string;
};

type FieldName =
  | "name"
  | "email"
  | "password"
  | "confirmPassword"
  | "acceptTerms";

export function SignUpForm({ className }: { className?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [success, setSuccess] = useState<RegisterResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = signUpSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
      acceptTerms,
    });

    if (!parsed.success) {
      const errors: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (
          key === "name" ||
          key === "email" ||
          key === "password" ||
          key === "confirmPassword" ||
          key === "acceptTerms"
        ) {
          errors[key] ??= issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password,
          confirmPassword: parsed.data.confirmPassword,
          acceptTerms: true,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as RegisterResponse;

      if (!response.ok) {
        setFormError(
          data.error ?? "Your account could not be created. Please try again.",
        );
        return;
      }

      setSuccess(data);
    } catch {
      setFormError(
        "We could not reach the server. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        id="sign-up-form"
        className="flex flex-col gap-5"
        aria-live="polite"
      >
        <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <MailCheckIcon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Check your email
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We created your account and sent a single-use verification link to{" "}
            <span className="font-medium text-foreground">
              {success.email ?? email}
            </span>
            . Open it before signing in.
          </p>
        </div>

        {success.emailDelivery === "unavailable" ? (
          <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-foreground">
            Email delivery is not configured in this environment. Ask a platform
            administrator to verify your account, or use the development link
            below when one is shown.
          </div>
        ) : null}

        {success.devVerificationUrl ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">
              Development only: email transport is console
            </p>
            <Link
              href={success.devVerificationUrl.replace(/^https?:\/\/[^/]+/, "")}
              className="mt-1 block break-all text-primary underline underline-offset-4"
            >
              Open the verification link
            </Link>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/sign-in" />}
            size="lg"
            className="h-10 w-full"
          >
            Continue to sign in
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Once verified you can sign in. A workspace administrator must invite
            you before you can open company data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      id="sign-up-form"
      onSubmit={handleSubmit}
      noValidate
      className={cn("flex flex-col gap-6", className)}
      aria-describedby={formError ? "sign-up-error" : undefined}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.7rem]">
          Create your account
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Set up a secure sign-in. Workspace access is granted separately by an
          administrator.
        </p>
      </div>

      {formError ? (
        <div
          id="sign-up-error"
          role="alert"
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          {formError}
        </div>
      ) : null}

      <div className="flex flex-col gap-5">
        <Field data-invalid={Boolean(fieldErrors.name)}>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Alex Morgan"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            disabled={isSubmitting}
            autoFocus
            required
          />
          {fieldErrors.name ? (
            <FieldError>{fieldErrors.name}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.email)}>
          <FieldLabel htmlFor="email">Work email</FieldLabel>
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
            aria-invalid={Boolean(fieldErrors.email)}
            disabled={isSubmitting}
            required
          />
          {fieldErrors.email ? (
            <FieldError>{fieldErrors.email}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.password)}>
          <FieldLabel htmlFor="new-password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="new-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby="password-policy"
              disabled={isSubmitting}
              className="pr-10"
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
          <PasswordChecklist id="password-policy" value={password} />
          {fieldErrors.password ? (
            <FieldError>{fieldErrors.password}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.confirmPassword)}>
          <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat your password"
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

        <Field data-invalid={Boolean(fieldErrors.acceptTerms)}>
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="accept-terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked === true)}
              disabled={isSubmitting}
              className="mt-0.5"
            />
            <FieldLabel htmlFor="accept-terms" className="font-normal">
              I agree to the{" "}
              <Link
                href="/legal/terms"
                className="text-primary underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/legal/privacy"
                className="text-primary underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                Privacy Policy
              </Link>
              .
            </FieldLabel>
          </div>
          {fieldErrors.acceptTerms ? (
            <FieldError>{fieldErrors.acceptTerms}</FieldError>
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
            Creating account
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 border-t border-border pt-5 text-sm text-muted-foreground">
        <CheckCircle2Icon className="size-4" aria-hidden="true" />
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
