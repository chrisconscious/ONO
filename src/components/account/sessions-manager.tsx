"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2Icon,
  MonitorSmartphoneIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

type SessionResponse = {
  error?: string;
  message?: string;
  sessions?: AccountSession[];
  revoked?: number;
};

type Confirmation =
  | { kind: "one"; session: AccountSession }
  | { kind: "others" }
  | null;

function formattedDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not recorded";
}

export function SessionsManager() {
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);

  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/account/sessions", {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as SessionResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Active sessions could not be loaded.");
      }

      setSessions(data.sessions ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Active sessions could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialSessions() {
      try {
        const response = await fetch("/api/auth/account/sessions", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as SessionResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Active sessions could not be loaded.");
        }

        if (active) setSessions(data.sessions ?? []);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Active sessions could not be loaded.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadInitialSessions();
    return () => {
      active = false;
    };
  }, []);

  async function revokeOne(session: AccountSession) {
    setBusy(session.id);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/auth/account/sessions/${encodeURIComponent(session.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json().catch(() => ({}))) as SessionResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "That session could not be signed out.");
      }

      setMessage(data.message ?? "The selected session was signed out.");
      await loadSessions();
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "That session could not be signed out.",
      );
    } finally {
      setBusy(null);
      setConfirmation(null);
    }
  }

  async function revokeOthers() {
    setBusy("others");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        "/api/auth/account/sessions/revoke-others",
        { method: "POST" },
      );
      const data = (await response.json().catch(() => ({}))) as SessionResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Other sessions could not be signed out.");
      }

      setMessage(data.message ?? "Other sessions have been signed out.");
      await loadSessions();
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "Other sessions could not be signed out.",
      );
    } finally {
      setBusy(null);
      setConfirmation(null);
    }
  }

  async function confirm() {
    if (!confirmation) return;
    if (confirmation.kind === "one") {
      await revokeOne(confirmation.session);
    } else {
      await revokeOthers();
    }
  }

  const otherSessions = sessions.filter((session) => !session.current);

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Location is not shown because ONO does not collect it. IP addresses are
          recorded by the sign-in service.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy !== null || otherSessions.length === 0}
          onClick={() => setConfirmation({ kind: "others" })}
        >
          {busy === "others" ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheckIcon aria-hidden="true" />
          )}
          Sign out other sessions
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading active sessions…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active sessions were found.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <MonitorSmartphoneIcon
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {session.device}
                    {session.current ? (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[0.7rem] font-medium text-primary">
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
                  onClick={() => setConfirmation({ kind: "one", session })}
                >
                  {busy === session.id ? (
                    <Loader2Icon className="animate-spin" aria-hidden="true" />
                  ) : null}
                  Revoke
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && busy === null) setConfirmation(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmation?.kind === "one"
                ? "Sign out this session?"
                : "Sign out other sessions?"}
            </DialogTitle>
            <DialogDescription>
              {confirmation?.kind === "one"
                ? `${confirmation.session.device} will need to sign in again. This device stays signed in.`
                : "Every other device signed in to this account will need to sign in again. This device stays signed in."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null}
              onClick={() => setConfirmation(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy !== null}
              onClick={() => void confirm()}
            >
              {busy !== null ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : null}
              {confirmation?.kind === "one"
                ? "Sign out session"
                : "Sign out other sessions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
