"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Loader2Icon, MonitorIcon, ShieldCheckIcon } from "lucide-react";
import type { Preferences } from "@/lib/auth/validation";
import { notifySignedOut } from "@/lib/auth/client-events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AccountSession = {
  id: string;
  device: string;
  ipAddress: string | null;
  createdAt: string;
  lastActivityAt: string | null;
  expiresAt: string;
  rememberMe: boolean;
  current: boolean;
};

type AccountResponse = {
  error?: string;
  message?: string;
  sessions?: AccountSession[];
  redirectTo?: string;
  signedOut?: boolean;
};

function formattedDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not recorded";
}

export function AccountSecurityPanel({
  user,
}: {
  user: {
    name: string;
    email: string;
    emailVerified: boolean;
    status: "ACTIVE" | "SUSPENDED";
    preferences: Preferences;
  };
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [name, setName] = useState(user.name);
  const [preferences, setPreferences] = useState(user.preferences);
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSessions() {
    try {
      const response = await fetch("/api/auth/account/sessions", {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as AccountResponse;
      if (!response.ok) throw new Error(data.error ?? "Sessions could not be loaded.");
      setSessions(data.sessions ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Sessions could not be loaded.",
      );
    } finally {
      setSessionsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function fetchInitialSessions() {
      try {
        const response = await fetch("/api/auth/account/sessions", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as AccountResponse;
        if (!response.ok) {
          throw new Error(data.error ?? "Sessions could not be loaded.");
        }
        if (active) setSessions(data.sessions ?? []);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Sessions could not be loaded.",
          );
        }
      } finally {
        if (active) setSessionsLoading(false);
      }
    }

    void fetchInitialSessions();
    return () => {
      active = false;
    };
  }, []);

  async function submit(
    key: string,
    url: string,
    method: "PATCH" | "POST" | "PUT",
    body: unknown,
    successMessage: string,
  ) {
    setBusy(key);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => ({}))) as AccountResponse;
      if (!response.ok) throw new Error(data.error ?? "Your changes could not be saved.");
      setMessage(data.message ?? successMessage);
      return true;
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Your changes could not be saved.",
      );
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await submit(
      "password",
      "/api/auth/account/password",
      "POST",
      { currentPassword, password, confirmPassword },
      "Password updated. Other devices have been signed out.",
    );
    if (saved) {
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      await loadSessions();
    }
  }

  async function revokeSession(session: AccountSession) {
    setBusy(session.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/auth/account/sessions/${encodeURIComponent(session.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json().catch(() => ({}))) as AccountResponse;
      if (!response.ok) throw new Error(data.error ?? "Session could not be revoked.");
      if (data.signedOut) {
        notifySignedOut();
        router.replace(data.redirectTo ?? "/sign-in?reason=signed-out");
        router.refresh();
        return;
      }
      setMessage("The selected session has been signed out.");
      await loadSessions();
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "Session could not be revoked.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function signOutEverywhere() {
    setBusy("all-sessions");
    setError(null);
    try {
      const response = await fetch("/api/auth/logout-all", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as AccountResponse;
      if (!response.ok) throw new Error(data.error ?? "Sessions could not be revoked.");
      notifySignedOut();
      router.replace(data.redirectTo ?? "/sign-in?reason=signed-out");
      router.refresh();
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "Sessions could not be revoked.",
      );
      setBusy(null);
    }
  }

  async function savePreferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await submit(
      "preferences",
      "/api/auth/account/preferences",
      "PUT",
      preferences,
      "Preferences saved.",
    );
    if (saved) setTheme(preferences.theme);
  }

  return (
    <div className="flex flex-col gap-5">
      {message || error ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-border bg-muted/40 text-foreground"
          }`}
          role={error ? "alert" : "status"}
          aria-live="polite"
        >
          {error ?? message}
        </div>
      ) : null}

      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the name associated with your account.
        </p>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(
              "profile",
              "/api/auth/account/profile",
              "PATCH",
              { name },
              "Profile saved.",
            );
          }}
        >
          <label className="grid gap-1.5 text-sm font-medium">
            Full name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              maxLength={80}
              required
            />
          </label>
          <Button type="submit" disabled={busy !== null}>
            {busy === "profile" ? <Loader2Icon className="animate-spin" /> : null}
            Save profile
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{user.email}</span>
          <span
            className={
              user.emailVerified
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-warning"
            }
          >
            {user.emailVerified ? "Verified" : "Not verified"}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-muted-foreground">Account status</span>
          <span
            className={
              user.status === "ACTIVE"
                ? "font-medium text-emerald-700 dark:text-emerald-400"
                : "font-medium text-destructive"
            }
          >
            {user.status === "ACTIVE" ? "Active" : "Suspended"}
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="font-semibold">Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Changing your password signs out other active devices.
        </p>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={changePassword}>
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
            Current password
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            New password
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={12}
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Confirm new password
            <Input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={12}
              required
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy !== null}>
              {busy === "password" ? <Loader2Icon className="animate-spin" /> : null}
              Update password
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Active sessions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review devices signed in to your account and revoke access.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null || sessions.length === 0}
            onClick={() => void signOutEverywhere()}
          >
            {busy === "all-sessions" ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <ShieldCheckIcon aria-hidden="true" />
            )}
            Sign out everywhere
          </Button>
        </div>

        {sessionsLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No active sessions were found.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <MonitorIcon
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {session.device}
                      {session.current ? (
                        <span className="ml-2 text-xs font-normal text-primary">
                          This device
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last active {formattedDate(session.lastActivityAt)}
                      {session.ipAddress ? ` · ${session.ipAddress}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Signed in {formattedDate(session.createdAt)}
                      {session.rememberMe ? " · Remembered device" : ""}
                    </p>
                  </div>
                </div>
                {!session.current ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => void revokeSession(session)}
                  >
                    {busy === session.id ? (
                      <Loader2Icon className="animate-spin" />
                    ) : null}
                    Revoke
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="font-semibold">Preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Preferences affect presentation only, never your access permissions.
        </p>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={savePreferences}>
          <label className="grid gap-1.5 text-sm font-medium">
            Theme
            <select
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              value={preferences.theme}
              onChange={(event) => {
                const theme = event.target.value;
                if (theme === "system" || theme === "light" || theme === "dark") {
                  setPreferences((current) => ({ ...current, theme }));
                }
              }}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Time zone
            <Input
              value={preferences.timeZone}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  timeZone: event.target.value,
                }))
              }
              placeholder="Africa/Dar_es_Salaam"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={preferences.emailNotifications}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  emailNotifications: event.target.checked,
                }))
              }
              className="size-4 accent-primary"
            />
            Email notifications
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy !== null}>
              {busy === "preferences" ? (
                <Loader2Icon className="animate-spin" />
              ) : null}
              Save preferences
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
