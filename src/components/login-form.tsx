"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api, ApiClientError, setStoredTenantId } from "@/lib/api/client";

interface LoginUser {
  id: string;
  email: string;
}

interface LoginResponse {
  user: LoginUser;
  memberships: Array<{ tenantId: string }>;
}

/**
 * Real credential login against POST /api/v1/auth/login.
 *
 * The server verifies credentials and issues an HttpOnly session cookie; this
 * component never stores tokens in JS-visible storage. On success we remember
 * the first membership as the active workspace hint (the server re-validates
 * membership on every request regardless of this value) and navigate into the
 * tenant workspace.
 */
export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return; // Guard against duplicate submissions.
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await api.post<LoginResponse>(
        "/api/v1/auth/login",
        { email, password },
        { tenantScoped: false },
      );
      if (result.memberships.length > 0) {
        setStoredTenantId(result.memberships[0].tenantId);
      }
      toast.success("Signed in");
      window.location.href = "/dashboard";
    } catch (err) {
      // The API returns a generic message for invalid credentials by design —
      // surface it without inventing detail.
      setFormError(
        err instanceof ApiClientError ? err.message : "Sign-in failed. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form className={`flex flex-col gap-6 ${className ?? ""}`} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Sign in to your account.</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Secure access to your business intelligence and management platform.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          {/* Accessible show/hide control with a stable accessible name. */}
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}
        <Field>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            Sign in
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
