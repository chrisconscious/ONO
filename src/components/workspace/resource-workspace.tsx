"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  ShieldAlertIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { TableSurface, TableToolbar } from "@/components/app/data-table";
import { cn } from "@/lib/utils";
import type {
  FieldOption,
  ResourceDefinition,
  ResourceField,
} from "@/lib/resources/registry";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  humanise,
  pluralise,
} from "@/lib/format";

type Row = Record<string, unknown>;

type Permissions = {
  create: boolean;
  update: boolean;
  delete: boolean;
};

type EditorState =
  | { mode: "create"; record: null }
  | { mode: "edit"; record: Row }
  | null;

type FormValue = string | boolean;

const PAGE_SIZE = 20;
const NONE = "__none";

function readPath(row: Row, path: string): unknown {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (value && typeof value === "object" && segment in (value as object)) {
      return (value as Row)[segment];
    }
    return undefined;
  }, row);
}

function isEmpty(value: unknown) {
  return value === null || value === undefined || value === "";
}

function displayCell(value: unknown, format: string | undefined, row: Row) {
  if (isEmpty(value)) return <span className="text-muted-foreground">—</span>;

  switch (format) {
    case "date":
      return formatDate(value as string | Date);
    case "datetime":
      return formatDateTime(value as string | Date);
    case "number":
      return <span className="tabular">{formatNumber(Number(value))}</span>;
    case "currency":
      return (
        <span className="tabular">
          {formatCurrency(
            value as string | number,
            typeof row.currency === "string" ? row.currency : "TZS",
          )}
        </span>
      );
    case "status":
      return <StatusBadge status={String(value)} />;
    case "boolean":
      return value ? "Yes" : "No";
    default:
      return String(value);
  }
}

function initialValue(field: ResourceField, record: Row | null): FormValue {
  if (!record) {
    if (field.type === "checkbox") return field.defaultValue === true;
    return field.defaultValue !== undefined ? String(field.defaultValue) : "";
  }

  const raw = record[field.name];

  if (field.type === "checkbox") return raw === true;
  if (field.type === "date") {
    if (typeof raw === "string") return raw.slice(0, 10);
    return "";
  }
  if (isEmpty(raw) || typeof raw === "object") return "";
  return String(raw);
}

/**
 * Shared list, create, edit and delete interface for tenant business records.
 *
 * The component never writes to the database directly: every read and mutation
 * goes through `/api/tenant/[resource]`, where the server re-checks the active
 * workspace and the required permission. Option lists are resolved on the
 * server and passed in so relation identifiers stay out of the browser form.
 */
export function ResourceWorkspace({
  definition,
  options,
  permissions,
}: {
  definition: ResourceDefinition;
  options: Record<string, FieldOption[]>;
  permissions: Permissions;
}) {
  const [records, setRecords] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState(definition.defaultSort);
  const [page, setPage] = useState(1);

  const [editor, setEditor] = useState<EditorState>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const next = search.trim();
      if (next === q) return;
      setLoading(true);
      setError(null);
      setPage(1);
      setQ(next);
    }, 350);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search, q]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort,
    });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    return params.toString();
  }, [page, q, sort, status]);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(
          `/api/tenant/${definition.key}?${queryString}`,
          { signal },
        );
        const data = (await response.json().catch(() => ({}))) as {
          records?: Row[];
          pagination?: { total?: number; pages?: number };
          error?: string;
        };

        if (!response.ok) {
          setError(data.error ?? "Unable to load records.");
          setRecords([]);
          setTotal(0);
          return;
        }

        setRecords(Array.isArray(data.records) ? data.records : []);
        setTotal(data.pagination?.total ?? 0);
      } catch (fetchError) {
        if ((fetchError as { name?: string }).name === "AbortError") return;
        setError("We could not reach the server. Check your connection and retry.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [definition.key, queryString],
  );

  useEffect(() => {
    const controller = new AbortController();
    // Start the request in a follow-up microtask so records only update from an
    // asynchronous callback rather than during the effect commit.
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load, reloadToken]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(q || status);
  const showActions = permissions.update || permissions.delete;

  /** Marks a user-initiated reload so the table shows its loading state. */
  function beginLoad() {
    setLoading(true);
    setError(null);
  }

  function reloadNow() {
    beginLoad();
    setReloadToken((value) => value + 1);
  }

  function afterMutation(message: string) {
    toast.success(message);
    beginLoad();
    setReloadToken((value) => value + 1);
  }

  const renderActions = (record: Row) => (
    <div className="flex shrink-0 items-center gap-1">
      {permissions.update ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setEditor({ mode: "edit", record })}
          aria-label={`Edit ${definition.singular}`}
        >
          <PencilIcon aria-hidden="true" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      ) : null}
      {permissions.delete ? (
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setDeleting(record)}
          aria-label={`Delete ${definition.singular}`}
        >
          <Trash2Icon aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="flex flex-col gap-4" aria-busy={loading}>
      <p className="sr-only" role="status" aria-live="polite">
        {loading
          ? `Loading ${definition.title.toLowerCase()}.`
          : `${total} ${pluralise(total, definition.singular)} available.`}
      </p>

      <TableSurface>
        <TableToolbar>
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={definition.searchPlaceholder}
              aria-label={definition.searchPlaceholder}
              className="h-8 w-full pl-8 sm:w-64"
            />
          </div>

          {definition.statusField ? (
            <Select
              value={status || "all"}
              onValueChange={(next) => {
                beginLoad();
                setPage(1);
                setStatus(!next || next === "all" ? "" : String(next));
              }}
            >
              <SelectTrigger size="sm" aria-label={definition.statusField.label}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">All</SelectItem>
                {definition.statusField.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {definition.sortOptions.length > 1 ? (
            <Select
              value={sort}
              onValueChange={(next) => {
                beginLoad();
                setPage(1);
                setSort(next ? String(next) : definition.defaultSort);
              }}
            >
              <SelectTrigger size="sm" aria-label="Sort records">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {definition.sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {hasFilters ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                beginLoad();
                setSearch("");
                setQ("");
                setStatus("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          ) : null}

          <span className="ml-auto hidden text-xs text-muted-foreground tabular sm:inline">
            {loading ? "Loading…" : `${total} ${pluralise(total, definition.singular)}`}
          </span>

          {permissions.create ? (
            <Button
              size="sm"
              className="ml-auto sm:ml-0"
              onClick={() => setEditor({ mode: "create", record: null })}
            >
              <PlusIcon aria-hidden="true" />
              Add {definition.singular}
            </Button>
          ) : null}
        </TableToolbar>

        {error ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 border-b border-destructive/20 bg-destructive/5 px-4 py-3"
          >
            <p className="flex items-center gap-2 text-sm text-destructive">
              <ShieldAlertIcon className="size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => reloadNow()}
            >
              <RotateCcwIcon aria-hidden="true" />
              Retry
            </Button>
          </div>
        ) : null}

        {loading && records.length === 0 ? (
          <TableSkeleton
            rows={5}
            columns={Math.min(definition.columns.length + (showActions ? 1 : 0), 6)}
          />
        ) : records.length === 0 && !error ? (
          <EmptyState
            icon={<SearchIcon aria-hidden="true" />}
            title={hasFilters ? "No matching records" : definition.emptyTitle}
            description={
              hasFilters
                ? "Adjust or clear the search and filter values to see more records."
                : definition.emptyDescription
            }
          />
        ) : records.length > 0 ? (
          <>
            {/* Compact cards keep long business names and numbers readable on phones. */}
            <ul className="divide-y divide-border md:hidden">
              {records.map((record) => {
                const primaryColumn = definition.columns[0];
                const secondaryColumns = definition.columns.slice(1, 4);

                return (
                  <li key={String(record.id)} className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {definition.detail ? (
                          <Link
                            href={`${definition.path}/${String(record.id)}`}
                            className="font-medium break-words text-foreground underline-offset-4 hover:underline focus-visible:underline"
                          >
                            {primaryColumn
                              ? displayCell(
                                  readPath(record, primaryColumn.key),
                                  primaryColumn.format,
                                  record,
                                )
                              : String(record.id)}
                          </Link>
                        ) : (
                          <p className="font-medium break-words text-foreground">
                            {primaryColumn
                              ? displayCell(
                                  readPath(record, primaryColumn.key),
                                  primaryColumn.format,
                                  record,
                                )
                              : String(record.id)}
                          </p>
                        )}
                      </div>
                      {showActions ? renderActions(record) : null}
                    </div>

                    {secondaryColumns.length > 0 ? (
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        {secondaryColumns.map((column) => (
                          <div key={column.key} className="min-w-0">
                            <dt className="text-muted-foreground">{column.label}</dt>
                            <dd className="mt-0.5 break-words text-foreground">
                              {displayCell(
                                readPath(record, column.key),
                                column.format,
                                record,
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <div className="hidden md:block">
              <Table aria-label={`${definition.title} records`}>
                <TableHeader>
                  <TableRow>
                    {definition.columns.map((column, index) => (
                      <TableHead
                        key={column.key}
                        className={index > 1 ? "hidden md:table-cell" : undefined}
                      >
                        {column.label}
                      </TableHead>
                    ))}
                    {showActions ? (
                      <TableHead className="w-px text-right">Actions</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={String(record.id)}>
                      {definition.columns.map((column, index) => (
                        <TableCell
                          key={column.key}
                          className={cn(
                            index > 1
                              ? "hidden text-muted-foreground md:table-cell"
                              : "text-foreground",
                          )}
                        >
                          <div className="max-w-[18rem] break-words whitespace-normal">
                            {index === 0 ? (
                              definition.detail ? (
                                <Link
                                  href={`${definition.path}/${String(record.id)}`}
                                  className="font-medium underline-offset-4 hover:underline focus-visible:underline"
                                >
                                  {displayCell(
                                    readPath(record, column.key),
                                    column.format,
                                    record,
                                  )}
                                </Link>
                              ) : (
                                <span className="font-medium">
                                  {displayCell(
                                    readPath(record, column.key),
                                    column.format,
                                    record,
                                  )}
                                </span>
                              )
                            ) : (
                              displayCell(
                                readPath(record, column.key),
                                column.format,
                                record,
                              )
                            )}
                          </div>
                        </TableCell>
                      ))}
                      {showActions ? (
                        <TableCell className="text-right whitespace-nowrap">
                          {renderActions(record)}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : null}

        {total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-xs text-muted-foreground">
            <span className="tabular">
              Page {Math.min(page, pages)} of {pages} · {total}{" "}
              {pluralise(total, definition.singular)}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => {
                  beginLoad();
                  setPage((value) => Math.max(1, value - 1));
                }}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pages || loading}
                onClick={() => {
                  beginLoad();
                  setPage((value) => Math.min(pages, value + 1));
                }}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </TableSurface>

      {editor ? (
        <RecordDialog
          definition={definition}
          options={options}
          record={editor.record}
          onClose={() => setEditor(null)}
          onSaved={(message) => {
            setEditor(null);
            afterMutation(message);
          }}
        />
      ) : null}

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DeleteDialog
          definition={definition}
          record={deleting}
          onCancel={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            afterMutation(`${definition.singular} deleted.`);
          }}
        />
      </Dialog>
    </div>
  );
}

function RecordDialog({
  definition,
  options,
  record,
  onClose,
  onSaved,
}: {
  definition: ResourceDefinition;
  options: Record<string, FieldOption[]>;
  record: Row | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [values, setValues] = useState<Record<string, FormValue>>(() =>
    Object.fromEntries(
      definition.fields.map((field) => [field.name, initialValue(field, record)]),
    ),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);

  const isEditing = record !== null;

  function setValue(name: string, value: FormValue) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function fieldOptions(field: ResourceField) {
    return field.optionsSource
      ? (options[field.optionsSource] ?? [])
      : (field.options ?? []);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    setFormError(null);

    const errors: Record<string, string> = {};
    for (const field of definition.fields) {
      const value = values[field.name];
      if (field.required) {
        if (field.type === "checkbox" && value !== true) {
          errors[field.name] = `${field.label} is required.`;
        } else if (field.type !== "checkbox" && String(value).trim() === "") {
          errors[field.name] = `${field.label} is required.`;
        }
      }
      if (
        field.type === "number" &&
        String(value).trim() !== "" &&
        !Number.isFinite(Number(value))
      ) {
        errors[field.name] = `${field.label} must be a number.`;
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: Record<string, unknown> = {};
    for (const field of definition.fields) {
      const value = values[field.name];

      if (field.type === "checkbox") {
        payload[field.name] = value === true;
        continue;
      }

      const text = String(value).trim();

      if (text === "") {
        // Nullable relation and status fields are cleared with a blank value;
        // static enum statuses are simply omitted so the server keeps its default.
        if (field.optionsSource || field.type !== "select") payload[field.name] = "";
        continue;
      }

      payload[field.name] = field.type === "number" ? Number(text) : text;
    }

    setSaving(true);
    submittingRef.current = true;
    try {
      const response = await fetch(
        isEditing
          ? `/api/tenant/${definition.key}/${String(record.id)}`
          : `/api/tenant/${definition.key}`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setFormError(data.error ?? `The ${definition.singular} could not be saved.`);
        return;
      }

      onSaved(
        isEditing
          ? `${humanise(definition.singular)} updated.`
          : `${humanise(definition.singular)} created.`,
      );
    } catch {
      setFormError("We could not reach the server. Check your connection and retry.");
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? `Edit ${definition.singular}`
              : `Add ${definition.singular}`}
          </DialogTitle>
          <DialogDescription>{definition.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          {formError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </p>
          ) : null}

          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              {definition.fields.map((field) => {
                const resolved = fieldOptions(field);
                const error = fieldErrors[field.name];
                const value = values[field.name];
                const wide = field.type === "textarea";

                return (
                  <Field
                    key={field.name}
                    data-invalid={error ? true : undefined}
                    className={wide ? "sm:col-span-2" : undefined}
                  >
                    {field.type === "checkbox" ? (
                      <label className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={value === true}
                          onCheckedChange={(checked) =>
                            setValue(field.name, checked === true)
                          }
                          disabled={saving}
                        />
                        <span>
                          <span className="font-medium text-foreground">
                            {field.label}
                          </span>
                          {field.description ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {field.description}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    ) : (
                      <>
                        <FieldLabel htmlFor={`${definition.key}-${field.name}`}>
                          {field.label}
                          {field.required ? (
                            <span className="text-destructive" aria-hidden="true">
                              {" "}
                              *
                            </span>
                          ) : null}
                        </FieldLabel>

                        {field.type === "textarea" ? (
                          <Textarea
                            id={`${definition.key}-${field.name}`}
                            rows={3}
                            value={String(value)}
                            placeholder={field.placeholder}
                            aria-invalid={error ? true : undefined}
                            onChange={(event) =>
                              setValue(field.name, event.target.value)
                            }
                            disabled={saving}
                          />
                        ) : field.type === "select" ? (
                          <Select
                            value={String(value) || NONE}
                            onValueChange={(next) =>
                              setValue(
                                field.name,
                                !next || next === NONE ? "" : String(next),
                              )
                            }
                            disabled={saving}
                          >
                            <SelectTrigger
                              id={`${definition.key}-${field.name}`}
                              className="w-full"
                              aria-invalid={error ? true : undefined}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="start">
                              {!field.required ? (
                                <SelectItem value={NONE}>Not set</SelectItem>
                              ) : null}
                              {resolved.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={`${definition.key}-${field.name}`}
                            type={
                              field.type === "number"
                                ? "number"
                                : field.type === "date"
                                  ? "date"
                                  : field.type === "email"
                                    ? "email"
                                    : "text"
                            }
                            inputMode={field.type === "number" ? "decimal" : undefined}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={String(value)}
                            placeholder={field.placeholder}
                            aria-invalid={error ? true : undefined}
                            onChange={(event) =>
                              setValue(field.name, event.target.value)
                            }
                            disabled={saving}
                          />
                        )}

                        {field.description ? (
                          <FieldDescription>{field.description}</FieldDescription>
                        ) : null}
                      </>
                    )}

                    <FieldError>{error}</FieldError>
                  </Field>
                );
              })}
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
              {saving
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : `Add ${definition.singular}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  definition,
  record,
  onCancel,
  onDeleted,
}: {
  definition: ResourceDefinition;
  record: Row | null;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deletingRef = useRef(false);

  const label = record
    ? String(
        record[definition.columns[0]?.key ?? "id"] ??
          record.name ??
          record.title ??
          definition.singular,
      )
    : definition.singular;

  async function remove() {
    if (!record || deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/tenant/${definition.key}/${String(record.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? `The ${definition.singular} could not be deleted.`);
        return;
      }

      onDeleted();
    } catch {
      setError("We could not reach the server. Check your connection and retry.");
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Delete this {definition.singular}?</DialogTitle>
        <DialogDescription>
          {label} will be permanently removed from {definition.title.toLowerCase()}.
          Records referenced by other data cannot be deleted; deactivate them instead.
        </DialogDescription>
      </DialogHeader>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={() => void remove()} disabled={deleting}>
          {deleting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
