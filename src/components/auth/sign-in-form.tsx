"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  LockIcon,
  MailWarningIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isSafeInternalPath } from "@/lib/auth/redirect";
import { signInSchema } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type SignInResponse = {
  redirectTo?: string;
  error?: string;
  code?: string;
};

export function SignInForm({
  next,
  email: initialEmail,
  notice,
  className,
}: {
  next?: string;
  email?: string;
  notice?: string | null;
  className?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setUnverified(false);

    const parsed = signInSchema.safeParse({
      email,
      password,
      rememberMe,
      next,
    });

    if (!parsed.success) {
      const errors: typeof fieldErrors = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "email") errors.email = issue.message;
        if (issue.path[0] === "password") errors.password = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsed.data.email,
          password: parsed.data.password,
          rememberMe: parsed.data.rememberMe,
          next,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as SignInResponse;

      if (!response.ok) {
        if (data.code === "EMAIL_UNVERIFIED") setUnverified(true);
        setFormError(data.error ?? "Unable to sign in. Please try again.");
        return;
      }

      // The server resolves the destination against the actor's actual
      // memberships and platform role, so prefer it over the requested path.
      const destination = isSafeInternalPath(data.redirectTo)
        ? data.redirectTo
        : isSafeInternalPath(next)
          ? next
          : "/app";

      router.replace(destination);
      router.refresh();
    } catch {
      setFormError(
        "We could not reach the server. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      id="sign-in-form"
      onSubmit={handleSubmit}
      noValidate
      className={cn("flex flex-col gap-6", className)}
      aria-describedby={formError ? "sign-in-error" : undefined}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.7rem]">
          Sign in to your account
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Secure access to your business intelligence and management platform.
        </p>
      </div>

      {notice ? (
        <div
          role="status"
          className="rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground"
        >
          {notice}
        </div>
      ) : null}

      {formError ? (
        <div
          id="sign-in-error"
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          <LockIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {formError}
            {unverified ? (
              <Link
                href={`/verify-email${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
                className="mt-1 block font-medium underline underline-offset-4"
              >
                Verify your email or request a new link
              </Link>
            ) : null}
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-5">
        <Field data-invalid={Boolean(fieldErrors.email)}>
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
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            disabled={isSubmitting}
            autoFocus
            required
          />
          {fieldErrors.email ? (
            <FieldError id="email-error">{fieldErrors.email}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.password)}>
          <div className="flex items-baseline justify-between gap-3">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? "password-error" : undefined
              }
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
          {fieldErrors.password ? (
            <FieldError id="password-error">{fieldErrors.password}</FieldError>
          ) : null}
        </Field>

        <Field orientation="horizontal">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            disabled={isSubmitting}
          />
          <FieldLabel htmlFor="remember-me" className="font-normal">
            Keep me signed in on this device
          </FieldLabel>
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
            Signing in
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <div className="flex flex-col gap-2 border-t border-border pt-5 text-sm text-muted-foreground">
        <p>
          New to ONO?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
        <p className="flex items-start gap-1.5 text-xs leading-relaxed">
          <MailWarningIcon
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          Workspace access is granted by invitation. Creating an account does
          not grant access to a company workspace.
        </p>
      </div>
    </form>
  );
}
