"use client";

import { useState } from "react";
import { Loader2Icon, MailIcon } from "lucide-react";
import { emailSchema } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type ResendResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  emailDelivery?: "sent" | "unavailable";
  devVerificationUrl?: string;
};

export function ResendVerificationForm({
  email: initialEmail,
  className,
}: {
  email?: string;
  className?: string;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResendResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data }),
      });
      const data = (await response.json().catch(() => ({}))) as ResendResponse;

      if (!response.ok) {
        setError(data.error ?? "A new link could not be sent.");
        return;
      }

      setResult(data);
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className={className} aria-live="polite">
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
          <MailIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <p>{result.message ?? "If that address needs verification, a new link has been sent."}</p>
            {result.emailDelivery === "unavailable" ? (
              <p className="mt-1 text-xs">
                Email delivery is not configured in this environment.
              </p>
            ) : null}
            {result.devVerificationUrl ? (
              <a
                href={result.devVerificationUrl}
                className="mt-1 block break-all text-xs text-primary underline underline-offset-4"
              >
                Development link: open verification page
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={className}>
      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="resend-email">Email address</FieldLabel>
        <div className="flex flex-wrap items-start gap-2">
          <Input
            id="resend-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(error)}
            disabled={isSubmitting}
            className="min-w-56 flex-1"
            required
          />
          <Button type="submit" variant="outline" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <MailIcon aria-hidden="true" />
            )}
            {isSubmitting ? "Sending" : "Send new link"}
          </Button>
        </div>
        <FieldError>{error}</FieldError>
      </Field>
    </form>
  );
}
