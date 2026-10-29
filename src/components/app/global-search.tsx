"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchResult = {
  type: string;
  id: string;
  title: string;
  meta: string;
  href: string;
};

/**
 * Workspace CRM search shown in the shell header.
 *
 * Results are filtered on the server by the actor's permissions. The component
 * never renders records the current role cannot read.
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<{
    term: string;
    results: SearchResult[];
    loading: boolean;
    error: string | null;
  }>({ term: "", results: [], loading: false, error: null });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    function handlePointer(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  useEffect(() => {
    const term = query.trim();
    if (!open || term.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearch({ term, results: [], loading: true, error: null });
      try {
        const response = await fetch(
          `/api/tenant/crm/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        const data = (await response.json().catch(() => ({}))) as {
          results?: SearchResult[];
          error?: string;
        };

        if (!response.ok) {
          setSearch({
            term,
            results: [],
            loading: false,
            error: data.error ?? "Search is unavailable.",
          });
          return;
        }
        setSearch({
          term,
          results: Array.isArray(data.results) ? data.results : [],
          loading: false,
          error: null,
        });
      } catch (requestError) {
        if (
          !(requestError instanceof DOMException) ||
          requestError.name !== "AbortError"
        ) {
          setSearch({
            term,
            results: [],
            loading: false,
            error: "Search is unavailable right now.",
          });
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  const activeTerm = query.trim();
  const current = search.term === activeTerm ? search : null;
  const pending = !current && activeTerm.length >= 2;
  const loading = current?.loading ?? false;
  const results = current?.results ?? [];
  const error = current?.error ?? null;
  const busy = loading || pending;

  const showEmpty =
    activeTerm.length >= 2 && !busy && !error && results.length === 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Search CRM records"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex size-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          open && "bg-muted text-foreground",
        )}
      >
        <SearchIcon className="size-4" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="CRM search"
          className="absolute top-full right-0 z-50 mt-2 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <SearchIcon
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search leads, contacts, accounts, deals"
              aria-label="Search CRM records"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {busy ? (
              <Loader2Icon
                className="size-4 shrink-0 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            ) : query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <XIcon className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {error ? (
              <p className="px-3 py-4 text-sm text-destructive">{error}</p>
            ) : pending ? (
              <p role="status" className="px-3 py-4 text-sm text-muted-foreground">
                Searching this workspace…
              </p>
            ) : showEmpty ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">
                No accessible record matches that search.
              </p>
            ) : results.length > 0 ? (
              <ul className="divide-y divide-border">
                {results.map((result) => (
                  <li key={`${result.type}-${result.id}`}>
                    <Link
                      href={result.href}
                      onClick={() => setOpen(false)}
                      className="flex flex-col gap-0.5 px-3 py-2.5 transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                          {result.type}
                        </span>
                        <span className="truncate text-sm font-medium text-foreground">
                          {result.title}
                        </span>
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {result.meta}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-4 text-xs text-muted-foreground">
                Type at least two characters to search this workspace.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
