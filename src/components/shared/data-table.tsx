"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiClientError } from "@/lib/api/client";

export interface ListResult<T> {
  total?: number;
  page?: number;
  pageSize?: number;
  /** Standard paginated shape. */
  items?: T[];
  /** Some summary endpoints (e.g. receivables) return `rows` instead. */
  rows?: T[];
}

interface DataTableProps<T> {
  /** API path relative to the app origin, e.g. "/api/v1/leads". */
  path: string;
  columns: { key: string; header: string; className?: string }[];
  renderRow: (row: T) => React.ReactNode;
  rowKey: (row: T) => string;
  /** Extra query params merged into every request (search, filters…). */
  query?: Record<string, string | number | undefined>;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Bumped by parents to force a refetch after a mutation. */
  refreshKey?: number;
  toolbar?: React.ReactNode;
  pageSize?: number;
  /**
   * When false the endpoint returns a plain array (e.g. /api/v1/products,
   * /api/v1/finance/receivables) instead of the paginated envelope.
   */
  paginated?: boolean;
}

/**
 * Reusable server-paginated data table wired to the real v1 list endpoints.
 *
 * Every fetch goes through the tenant-scoped API client, so the server — not
 * the browser — decides which records are visible. Loading, empty, and error
 * states are explicit; no placeholder rows are ever rendered.
 */
export function DataTable<T>({
  path,
  columns,
  renderRow,
  rowKey,
  query,
  emptyTitle = "No records yet",
  emptyDescription = "Records you create will appear here.",
  refreshKey = 0,
  toolbar,
  pageSize = 20,
  paginated = true,
}: DataTableProps<T>) {
  const [data, setData] = useState<ListResult<T> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Serialize the extra query object so effect deps stay stable across renders.
  const queryKey = JSON.stringify(query ?? {});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const q = JSON.parse(queryKey) as Record<string, string | number | undefined>;
    const request = paginated
      ? api.get<ListResult<T>>(path, { ...q, page, pageSize })
      : api
          .get<T[]>(path, q)
          .then((rows) => ({ items: Array.isArray(rows) ? rows : rows?.items ?? [] }));
    request
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Show the server's safe message only — never stack traces or internals.
        setError(
          err instanceof ApiClientError ? err.message : "Could not load records. Please retry.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, page, pageSize, queryKey, refreshKey, paginated]);

  if (loading && !data) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading records">
        {toolbar}
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => setPage((p) => p)}>
          <RefreshCw className="size-4" aria-hidden="true" /> Retry
        </Button>
      </div>
    );
  }

  const items = data?.items ?? data?.rows ?? [];
  const total = data?.total ?? items.length;
  const totalPages = Math.max(1, Math.ceil((total || items.length) / pageSize));

  return (
    <div className="space-y-3">
      {toolbar}
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">{emptyTitle}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key} className={c.className}>
                    {c.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={rowKey(row)}>{renderRow(row)}</TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} record{total === 1 ? "" : "s"} · page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
            {loading && <Loader2 className="ml-1 size-4 animate-spin" aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
