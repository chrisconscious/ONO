"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { CheckCircle2Icon, Loader2Icon, MonitorCogIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Preferences } from "@/lib/auth/validation";

type PreferenceResponse = {
  ok?: boolean;
  error?: string;
  details?: Record<string, string[]>;
  preferences?: Preferences;
};

const themes = [
  { value: "system", label: "Match system" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

export function PreferencesForm({
  initialPreferences,
}: {
  initialPreferences: Preferences;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function useDeviceTimeZone() {
    try {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (zone) update("timeZone", zone);
    } catch {
      // The browser does not expose a time zone; the field stays editable.
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/auth/account/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const data = (await response.json().catch(() => ({}))) as PreferenceResponse;

      if (!response.ok) {
        setFieldErrors(data.details ?? {});
        setError(data.error ?? "Your preferences could not be saved.");
        return;
      }

      if (data.preferences) {
        setPreferences(data.preferences);
        setTheme(data.preferences.theme);
      }
      setMessage("Preferences saved.");
      router.refresh();
    } catch {
      setError("We could not reach the server. Check your connection and retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={save}>
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

      <fieldset className="grid gap-4">
        <legend className="text-sm font-semibold text-foreground">Appearance</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {themes.map((theme) => {
            const selected = preferences.theme === theme.value;
            return (
              <label
                key={theme.value}
                className={
                  selected
                    ? "flex cursor-pointer items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2.5 text-sm"
                    : "flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:bg-muted/60"
                }
              >
                <input
                  type="radio"
                  name="theme"
                  value={theme.value}
                  checked={selected}
                  onChange={() => update("theme", theme.value)}
                  className="size-4 accent-primary"
                />
                <span className="font-medium text-foreground">{theme.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="h-px bg-border" />

      <div className="grid gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Regional</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Language and time zone affect dates and labels, never permissions.
          </p>
        </div>

        <label className="grid gap-1.5 text-sm font-medium">
          Language
          <select
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm md:text-sm"
            value={preferences.locale}
            onChange={(event) => update("locale", event.target.value as Preferences["locale"])}
          >
            <option value="en">English</option>
          </select>
          <span className="text-xs font-normal text-muted-foreground">
            More languages will appear here when they are supported.
          </span>
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Time zone
          <span className="flex gap-2">
            <Input
              value={preferences.timeZone}
              onChange={(event) => update("timeZone", event.target.value)}
              placeholder="Africa/Dar_es_Salaam"
              aria-invalid={Boolean(fieldErrors.timeZone)}
              aria-describedby={
                fieldErrors.timeZone ? "time-zone-error" : "time-zone-help"
              }
            />
            <Button
              type="button"
              variant="outline"
              onClick={useDeviceTimeZone}
              className="shrink-0"
            >
              <MonitorCogIcon aria-hidden="true" />
              Use device
            </Button>
          </span>
          <span
            id="time-zone-help"
            className="text-xs font-normal text-muted-foreground"
          >
            Enter an IANA time zone name. Leave blank to use the device default.
          </span>
          {fieldErrors.timeZone ? (
            <span id="time-zone-error" className="text-xs font-normal text-destructive">
              {fieldErrors.timeZone[0]}
            </span>
          ) : null}
        </label>
      </div>

      <div className="h-px bg-border" />

      <div className="grid gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose whether ONO may email you about your account.
          </p>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={preferences.emailNotifications}
            onChange={(event) => update("emailNotifications", event.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            <span className="font-medium text-foreground">Email notifications</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Account and security messages are always sent when required.
            </span>
          </span>
        </label>
      </div>

      <div>
        <Button type="submit" disabled={busy}>
          {busy ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2Icon aria-hidden="true" />
          )}
          Save preferences
        </Button>
      </div>
    </form>
  );
}
