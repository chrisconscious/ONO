"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
}

/** Debounced search box that writes `q` into the query string. */
export function SearchInput({
  param = "q",
  placeholder = "Search…",
  className,
}: {
  param?: string;
  placeholder?: string;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const updateQuery = useQueryUpdater();
  const current = searchParams.get(param) ?? "";
  const [value, setValue] = useState(current);
  const lastCurrent = useRef(current);

  // Adopt externally-driven query changes (navigation, cleared filters) without
  // overwriting text the user is still typing.
  useEffect(() => {
    if (lastCurrent.current === current) return;
    lastCurrent.current = current;
    setValue(current);
  }, [current]);

  useEffect(() => {
    if (value === current) return;

    const timer = setTimeout(() => {
      updateQuery((params) => {
        if (value.trim()) params.set(param, value.trim());
        else params.delete(param);
        params.delete("page");
      });
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, current, param]);

  return (
    <div className={className}>
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-8 w-full pl-8 sm:w-64"
        />
      </div>
    </div>
  );
}

/** Select control that writes a query parameter and resets pagination. */
export function FilterSelect({
  param,
  label,
  options,
  allLabel = "All",
  className,
}: {
  param: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  allLabel?: string;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const updateQuery = useQueryUpdater();
  const current = searchParams.get(param) ?? "all";

  return (
    <Select
      value={current}
      onValueChange={(next) => {
        updateQuery((params) => {
          if (!next || next === "all") params.delete(param);
          else params.set(param, String(next));
          params.delete("page");
        });
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={label}
        className={className}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Two date inputs that write `from` and `to` into the query string. */
export function DateRangeFilter({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const updateQuery = useQueryUpdater();
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const apply = (key: "from" | "to", value: string) => {
    updateQuery((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
    });
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Input
        type="date"
        aria-label="Submitted from"
        value={from}
        max={to || undefined}
        onChange={(event) => apply("from", event.target.value)}
        className="h-8 w-36"
      />
      <span className="text-xs text-muted-foreground">to</span>
      <Input
        type="date"
        aria-label="Submitted to"
        value={to}
        min={from || undefined}
        onChange={(event) => apply("to", event.target.value)}
        className="h-8 w-36"
      />
    </div>
  );
}

/** Clears every filter while keeping the path. */
export function ClearFilters({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <Link
      href={pathname}
      className={
        className ??
        "inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      }
    >
      <XIcon className="size-3.5" aria-hidden="true" />
      Clear
    </Link>
  );
}
