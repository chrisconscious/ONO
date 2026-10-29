"use client";

import { useMemo, useState } from "react";
import { BoxesIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/app/states";
import { TableSurface, TableToolbar } from "@/components/app/data-table";
import type { StockLevelRow } from "@/server/services/tenant/records.service";
import { formatNumber, pluralise } from "@/lib/format";

const PAGE_SIZE = 20;

/**
 * Derived stock levels per product and warehouse. The rows are calculated on the
 * server from immutable movements; this screen only filters and presents them.
 */
export function StockLevelsTable({ rows }: { rows: StockLevelRow[] }) {
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("all");
  const [sort, setSort] = useState("product:asc");
  const [outOfStockOnly, setOutOfStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  const warehouses = useMemo(
    () =>
      [...new Map(rows.map((row) => [row.warehouseId, row.warehouseName])).entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [rows],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const [field, direction] = sort.split(":");

    return rows
      .filter((row) => {
        if (warehouse !== "all" && row.warehouseId !== warehouse) return false;
        if (outOfStockOnly && row.quantity > 0) return false;
        if (!term) return true;
        return (
          row.productName.toLowerCase().includes(term) ||
          (row.sku ?? "").toLowerCase().includes(term) ||
          row.warehouseName.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const result =
          field === "quantity"
            ? a.quantity - b.quantity
            : a.productName.localeCompare(b.productName);
        return direction === "desc" ? -result : result;
      });
  }, [outOfStockOnly, rows, search, sort, warehouse]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const hasFilters = Boolean(search || warehouse !== "all" || outOfStockOnly);

  return (
    <div className="flex flex-col gap-4">
      <TableSurface>
        <TableToolbar>
        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search product, SKU or warehouse…"
            aria-label="Search stock levels"
            className="h-8 w-full pl-8 sm:w-64"
          />
        </div>

        <Select
          value={warehouse}
          onValueChange={(next) => {
            setWarehouse(!next ? "all" : String(next));
            setPage(1);
          }}
        >
          <SelectTrigger size="sm" aria-label="Filter by warehouse">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="all">All warehouses</SelectItem>
            {warehouses.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sort}
          onValueChange={(next) => {
            setSort(next ? String(next) : "product:asc");
            setPage(1);
          }}
        >
          <SelectTrigger size="sm" aria-label="Sort stock levels">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="product:asc">Product A–Z</SelectItem>
            <SelectItem value="product:desc">Product Z–A</SelectItem>
            <SelectItem value="quantity:asc">Lowest quantity</SelectItem>
            <SelectItem value="quantity:desc">Highest quantity</SelectItem>
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={outOfStockOnly}
            onCheckedChange={(checked) => {
              setOutOfStockOnly(checked === true);
              setPage(1);
            }}
          />
          Out of stock only
        </label>

        {hasFilters ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSearch("");
              setWarehouse("all");
              setOutOfStockOnly(false);
              setPage(1);
            }}
          >
            Clear
          </Button>
        ) : null}

        <span className="ml-auto text-xs text-muted-foreground tabular" aria-live="polite">
          {filtered.length} {pluralise(filtered.length, "stock line")}
        </span>
      </TableToolbar>

      {visible.length === 0 ? (
        <EmptyState
          icon={<BoxesIcon aria-hidden="true" />}
          title={hasFilters ? "No stock lines match" : "No stock recorded"}
          description={
            hasFilters
              ? "Adjust the search, warehouse or stock filter to see more results."
              : "Record a stock movement to begin tracking quantities by warehouse."
          }
        />
      ) : (
        <>
          {/* Mobile cards avoid forcing a wide table on narrow screens. */}
          <ul className="divide-y divide-border sm:hidden">
            {visible.map((row) => (
              <li
                key={`${row.productId ?? "none"}-${row.warehouseId}`}
                className="flex flex-col gap-2 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium break-words text-foreground">
                      {row.productName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {row.sku ?? "No SKU"}
                    </p>
                  </div>
                  <span
                    className={
                      row.quantity <= 0
                        ? "shrink-0 font-medium text-destructive tabular"
                        : "shrink-0 tabular"
                    }
                  >
                    {formatNumber(row.quantity)}
                  </span>
                </div>
                <p className="text-xs break-words text-muted-foreground">
                  {row.warehouseName}
                </p>
              </li>
            ))}
          </ul>

          <div className="hidden sm:block">
            <Table aria-label="Stock levels by product and warehouse">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden sm:table-cell">SKU</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => (
                  <TableRow key={`${row.productId ?? "none"}-${row.warehouseId}`}>
                    <TableCell className="font-medium text-foreground">
                      <div className="max-w-[18rem] break-words whitespace-normal">
                        {row.productName}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {row.sku ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="max-w-[14rem] break-words whitespace-normal">
                        {row.warehouseName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          row.quantity <= 0
                            ? "font-medium text-destructive tabular"
                            : "tabular"
                        }
                      >
                        {formatNumber(row.quantity)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {filtered.length > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-xs text-muted-foreground">
          <span className="tabular">
            Page {currentPage} of {pages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= pages}
              onClick={() => setPage((value) => Math.min(pages, value + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
      </TableSurface>
    </div>
  );
}
