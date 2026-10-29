import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatNumber, pluralise } from "@/lib/format";
import { Table } from "@/components/ui/table";

export function TableSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-xs",
        className,
      )}
    >
      <div className="scrollbar-slim overflow-x-auto">{children}</div>
    </div>
  );
}

export function TableToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

function buildHref(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  params = {},
  itemLabel = "result",
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  params?: Record<string, string | undefined>;
  itemLabel?: string;
  className?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-4 py-2.5",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground tabular">
        {total === 0
          ? `No ${pluralise(2, itemLabel)}`
          : `${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(total)} ${pluralise(total, itemLabel)}`}
      </p>

      <div className="flex items-center gap-1.5">
        {currentPage <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeftIcon aria-hidden="true" />
            Previous
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            render={<Link href={buildHref(basePath, params, currentPage - 1)} />}
          >
            <ChevronLeftIcon aria-hidden="true" />
            Previous
          </Button>
        )}
        <span className="px-1 text-xs text-muted-foreground tabular">
          {currentPage} / {pageCount}
        </span>
        {currentPage >= pageCount ? (
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            render={<Link href={buildHref(basePath, params, currentPage + 1)} />}
          >
            Next
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

export { Table };
