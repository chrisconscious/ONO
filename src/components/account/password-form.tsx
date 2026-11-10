"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  CircleIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { passwordRules } from "@/lib/auth/validation";
import { cn } from "@/lib/utils";

type PasswordResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  details?: Record<string, string[]>;
};

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="grid gap-1.5 text-sm font-medium" htmlFor={id}>
      {label}
      <span className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="pr-9"
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-8 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {visible ? (
            <EyeOffIcon className="size-4" aria-hidden="true" />
          ) : (
            <EyeIcon className="size-4" aria-hidden="true" />
          )}
        </button>
      </span>
      {error ? (
        <span id={`${id}-error`} className="text-xs font-normal text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function PasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/auth/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password, confirmPassword }),
      });
      const data = (await response.json().catch(() => ({}))) as PasswordResponse;

      if (!response.ok) {
        setFieldErrors(data.details ?? {});
        setError(data.error ?? "Your password could not be changed.");
        return;
      }

      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setMessage(
        data.message ?? "Password updated. Other devices have been signed out.",
      );
      router.refresh();
    } catch {
      setError("We could not reach the server. Check your connection and retry.");
    } finally {
      setBusy(false);
    }
  }

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="flex flex-col gap-4">
      {message ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground"
        >
          {message}
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <form className="grid gap-4" onSubmit={submit}>
        <PasswordInput
          id="current-password"
          label="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
          error={fieldErrors.currentPassword?.[0]}
        />

        <PasswordInput
          id="new-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          error={fieldErrors.password?.[0]}
        />

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium text-foreground">
            Your new password must include:
          </p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {passwordRules.map((rule) => {
              const met = rule.test(password);
              return (
                <li
                  key={rule.id}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    met ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
                  )}
                >
                  {met ? (
                    <CheckCircle2Icon className="size-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <CircleIcon className="size-3.5 shrink-0" aria-hidden="true" />
                  )}
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>

        <PasswordInput
          id="confirm-password"
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          error={
            fieldErrors.confirmPassword?.[0] ??
            (mismatch ? "The passwords do not match." : undefined)
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : (
              <KeyRoundIcon aria-hidden="true" />
            )}
            Update password
          </Button>
          <p className="text-xs text-muted-foreground">
            Changing your password signs out every other device and rotates this
            session.
          </p>
        </div>
      </form>
    </div>
  );
}
