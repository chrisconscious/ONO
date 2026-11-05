"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3Icon, Loader2Icon, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  currentInternalPath,
  notifySessionExtended,
  notifySignedOut,
  onSessionExtended,
  onSignedOut,
} from "@/lib/auth/client-events";

type SessionDeadlines = {
  warningAt: string;
  expiresAt: string;
  serverNow: string;
};

type SessionResponse = {
  authenticated?: boolean;
  error?: string;
  session?: SessionDeadlines & {
    state?: "active" | "warning" | "expired";
  };
};

type Timing = SessionDeadlines & {
  /** serverNow - client clock at receipt, so countdowns follow the server. */
  offset: number;
};

function timingFrom(session: SessionDeadlines, receivedAt = Date.now()): Timing {
  return { ...session, offset: Date.parse(session.serverNow) - receivedAt };
}

function secondsUntil(deadline: string, now: number, offset: number) {
  return Math.max(0, Math.ceil((Date.parse(deadline) - (now + offset)) / 1000));
}

function countdownLabel(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Idle-timeout warning.
 *
 * The countdown is derived from server deadlines; no background heartbeat keeps
 * the session alive. The component revalidates when the tab becomes visible or
 * is restored from the back/forward cache, and reacts to sign-out/extension
 * events from other tabs, so a revoked session cannot be reused from a stale
 * page.
 */
export function SessionExpiryPrompt({
  initialSession,
}: {
  initialSession: SessionDeadlines;
}) {
  const router = useRouter();
  const [timing, setTiming] = useState<Timing>(() => timingFrom(initialSession));
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<"continue" | "logout" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ending = useRef(false);

  const warningAt = Date.parse(timing.warningAt);
  const expiresAt = Date.parse(timing.expiresAt);
  const isWarning = now + timing.offset >= warningAt;
  const remaining = secondsUntil(timing.expiresAt, now, timing.offset);

  const goToSignIn = useCallback(
    async (reason: "expired" | "signed-out") => {
      if (ending.current) return;
      ending.current = true;

      try {
        // Clear the cookie so the redirect cannot be bounced back into a
        // protected page by a still-valid server session.
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // The server still rejects an expired or revoked session.
      } finally {
        notifySignedOut();
        const next = currentInternalPath();
        const query = new URLSearchParams({ reason });
        if (next) query.set("next", next);
        router.replace(`/sign-in?${query.toString()}`);
        router.refresh();
      }
    },
    [router],
  );

  const revalidate = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const data = (await response.json().catch(() => ({}))) as SessionResponse;

      if (!response.ok || !data.authenticated || !data.session) {
        void goToSignIn("expired");
        return;
      }

      if (data.session.state === "expired") {
        void goToSignIn("expired");
        return;
      }

      setTiming(timingFrom(data.session));
      setNow(Date.now());
    } catch {
      // A transient network failure must not sign the user out. The countdown
      // still runs, and the next page request revalidates on the server.
    }
  }, [goToSignIn]);

  // Wake up exactly when the warning window starts, then tick once a second.
  useEffect(() => {
    const wait = Math.max(0, warningAt - (Date.now() + timing.offset));
    const timer = window.setTimeout(() => setNow(Date.now()), wait);
    return () => window.clearTimeout(timer);
  }, [timing.offset, warningAt]);

  useEffect(() => {
    if (!isWarning) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isWarning]);

  useEffect(() => {
    if (now + timing.offset >= expiresAt) {
      void goToSignIn("expired");
    }
  }, [expiresAt, goToSignIn, now, timing.offset]);

  // Event-driven revalidation: hidden tabs never keep a session alive.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") void revalidate();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void revalidate();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [revalidate]);

  // Another tab signed out or continued the session.
  useEffect(
    () =>
      onSignedOut(() => {
        void goToSignIn("signed-out");
      }),
    [goToSignIn],
  );

  useEffect(
    () =>
      onSessionExtended((session) => {
        setTiming(timingFrom(session));
        setNow(Date.now());
      }),
    [],
  );

  async function continueSession() {
    setBusy("continue");
    setError(null);
    try {
      const response = await fetch("/api/auth/session/touch", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const data = (await response.json().catch(() => ({}))) as SessionResponse;

      if (response.status === 401) {
        await goToSignIn("expired");
        return;
      }

      if (!response.ok || !data.session) {
        setError(data.error ?? "Your session could not be continued.");
        return;
      }

      setTiming(timingFrom(data.session));
      setNow(Date.now());
      notifySessionExtended(data.session);
    } catch {
      setError(
        "We could not reach the server. Check your connection and try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function signOut() {
    setBusy("logout");
    await goToSignIn("signed-out");
    setBusy(null);
  }

  if (!isWarning || remaining <= 0) return null;

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-full bg-warning/10 text-warning">
            <Clock3Icon className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>Your session is about to expire</DialogTitle>
          <DialogDescription>
            For your security, you will be signed out in{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {countdownLabel(remaining)}
            </span>{" "}
            unless you continue.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void signOut()}
          >
            {busy === "logout" ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : (
              <LogOutIcon aria-hidden="true" />
            )}
            Log out
          </Button>
          <Button
            type="button"
            disabled={busy !== null}
            onClick={() => void continueSession()}
          >
            {busy === "continue" ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : null}
            Continue session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
