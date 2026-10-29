"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SaveIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PlatformSettingsView } from "@/server/services/platform/settings.service";

/** Edits the stored platform configuration through the audited admin API. */
export function PlatformSettingsForm({
  initialSettings,
}: {
  initialSettings: PlatformSettingsView;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initialSettings);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    platformName?: string;
    supportEmail?: string;
    defaultCurrency?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof PlatformSettingsView>(
    key: K,
    value: PlatformSettingsView[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nextErrors: typeof errors = {};
    if (!values.platformName.trim()) {
      nextErrors.platformName = "Enter the platform name.";
    }
    if (
      values.supportEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.supportEmail.trim())
    ) {
      nextErrors.supportEmail = "Enter a valid email address, or leave it empty.";
    }
    if (!/^[A-Za-z]{3}$/.test(values.defaultCurrency.trim())) {
      nextErrors.defaultCurrency = "Use a three-letter currency code.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformName: values.platformName.trim(),
          supportEmail: values.supportEmail.trim(),
          defaultCurrency: values.defaultCurrency.trim().toUpperCase(),
          allowTenantSignup: values.allowTenantSignup,
          maintenanceMessage: values.maintenanceMessage.trim(),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        settings?: PlatformSettingsView;
        error?: string;
      };

      if (!response.ok || !data.settings) {
        setError(data.error ?? "Could not save the platform settings.");
        return;
      }

      setValues(data.settings);
      toast.success("Platform settings saved.");
      router.refresh();
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.platformName)}>
            <FieldLabel htmlFor="settings-platform-name">Platform name</FieldLabel>
            <Input
              id="settings-platform-name"
              value={values.platformName}
              onChange={(event) => update("platformName", event.target.value)}
              aria-invalid={Boolean(errors.platformName)}
              disabled={isSubmitting}
            />
            {errors.platformName ? (
              <FieldError>{errors.platformName}</FieldError>
            ) : null}
          </Field>

          <Field data-invalid={Boolean(errors.supportEmail)}>
            <FieldLabel htmlFor="settings-support-email">Support email</FieldLabel>
            <Input
              id="settings-support-email"
              type="email"
              inputMode="email"
              value={values.supportEmail}
              placeholder="support@example.com"
              onChange={(event) => update("supportEmail", event.target.value)}
              aria-invalid={Boolean(errors.supportEmail)}
              disabled={isSubmitting}
            />
            {errors.supportEmail ? (
              <FieldError>{errors.supportEmail}</FieldError>
            ) : (
              <FieldDescription>
                Shown to workspace administrators when they need help.
              </FieldDescription>
            )}
          </Field>

          <Field data-invalid={Boolean(errors.defaultCurrency)}>
            <FieldLabel htmlFor="settings-currency">
              Default currency
            </FieldLabel>
            <Input
              id="settings-currency"
              value={values.defaultCurrency}
              maxLength={3}
              className="w-28 uppercase"
              onChange={(event) => update("defaultCurrency", event.target.value.toUpperCase())}
              aria-invalid={Boolean(errors.defaultCurrency)}
              disabled={isSubmitting}
            />
            {errors.defaultCurrency ? (
              <FieldError>{errors.defaultCurrency}</FieldError>
            ) : (
              <FieldDescription>
                Three-letter ISO code used for new tenant records.
              </FieldDescription>
            )}
          </Field>
        </div>

        <Field orientation="horizontal">
          <Checkbox
            id="settings-signup"
            checked={values.allowTenantSignup}
            onCheckedChange={(checked) => update("allowTenantSignup", checked)}
            disabled={isSubmitting}
          />
          <div className="flex flex-col gap-0.5">
            <FieldLabel htmlFor="settings-signup">
              Allow tenant self-signup
            </FieldLabel>
            <FieldDescription>
              When enabled, a public onboarding flow may create tenant
              workspaces. This does not grant platform administration.
            </FieldDescription>
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="settings-maintenance">
            Maintenance message
          </FieldLabel>
          <Textarea
            id="settings-maintenance"
            value={values.maintenanceMessage}
            rows={3}
            maxLength={280}
            placeholder="Leave empty when the platform is operating normally."
            onChange={(event) => update("maintenanceMessage", event.target.value)}
            disabled={isSubmitting}
          />
          <FieldDescription>
            {values.maintenanceMessage.length}/280 characters. Shown as a
            platform notice when provided.
          </FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <SaveIcon aria-hidden="true" />
          )}
          {isSubmitting ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
