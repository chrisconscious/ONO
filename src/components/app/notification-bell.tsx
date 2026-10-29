"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellIcon, Loader2Icon } from "lucide-react";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

/**
 * In-app notification bell.
 *
 * Notifications are produced by the server (for example by an automation).
 * Opening or marking them read never sends an external message.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function loadUnread() {
      try {
        const response = await fetch("/api/tenant/notifications?limit=1");
        if (!response.ok) return;
        const data = (await response.json()) as { unread?: number };
        if (active && typeof data.unread === "number") setUnread(data.unread);
      } catch {
        // The bell is not critical; a failed count stays at its last value.
      }
    }
    void loadUnread();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function loadNotifications() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/tenant/notifications?limit=20");
      const data = (await response.json().catch(() => ({}))) as {
        items?: NotificationItem[];
        unread?: number;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Notifications are unavailable.");
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
      if (typeof data.unread === "number") setUnread(data.unread);
    } catch {
      setError("Notifications are unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  async function markRead(payload: { id?: string; all?: boolean }) {
    try {
      const response = await fetch("/api/tenant/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) return;

      if (payload.all) {
        setUnread(0);
        setItems((current) =>
          current.map((item) => ({ ...item, readAt: new Date().toISOString() })),
        );
        return;
      }

      if (payload.id) {
        setItems((current) =>
          current.map((item) =>
            item.id === payload.id
              ? { ...item, readAt: new Date().toISOString() }
              : item,
          ),
        );
        setUnread((current) => Math.max(0, current - 1));
      }
    } catch {
      // Marking read is best-effort and does not affect the underlying record.
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) void loadNotifications();
        }}
        className={cn(
          "relative flex size-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          open && "bg-muted text-foreground",
        )}
      >
        <BellIcon className="size-4" aria-hidden="true" />
        {unread > 0 ? (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-full right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <button
              type="button"
              onClick={() => void markRead({ all: true })}
              disabled={unread === 0}
              className="text-xs text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2Icon
                  className="size-5 animate-spin text-muted-foreground"
                  aria-label="Loading notifications"
                />
              </div>
            ) : error ? (
              <p className="px-3 py-4 text-sm text-destructive">{error}</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted-foreground">
                No notifications yet. Automations can create follow-up alerts
                here.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const content = (
                    <>
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {item.title}
                        </span>
                        {!item.readAt ? (
                          <span
                            aria-label="Unread"
                            className="mt-1 size-2 shrink-0 rounded-full bg-primary"
                          />
                        ) : null}
                      </span>
                      {item.body ? (
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                          {item.body}
                        </span>
                      ) : null}
                      <time
                        dateTime={item.createdAt}
                        className="mt-1 block text-[0.7rem] text-muted-foreground"
                      >
                        {formatRelative(item.createdAt)}
                      </time>
                    </>
                  );

                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <Link
                          href={item.href}
                          onClick={() => {
                            void markRead({ id: item.id });
                            setOpen(false);
                          }}
                          className="block px-3 py-2.5 transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none"
                        >
                          {content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void markRead({ id: item.id })}
                          className="block w-full px-3 py-2.5 text-left transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none"
                        >
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
