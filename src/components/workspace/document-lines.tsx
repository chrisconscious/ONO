"use client";

import { useRef, useState } from "react";
import {
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  ReceiptTextIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/app/states";
import { TableSurface } from "@/components/app/data-table";
import type { FieldOption } from "@/lib/resources/registry";
import type { DocumentKey } from "@/lib/resources/documents";
import type {
  DocumentLineRow,
  DocumentDetail,
} from "@/server/services/tenant/document-lines.service";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

const NONE = "__none";

type FormValues = {
  description: string;
  productId: string;
  quantity: string;
  unitPrice: string;
};

type EditorState =
  | { mode: "create"; line: null }
  | { mode: "edit"; line: DocumentLineRow }
  | null;

function lineTotal(values: FormValues) {
  const quantity = Number(values.quantity);
  const unitPrice = Number(values.unitPrice);
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return 0;
  return Math.round((quantity * unitPrice + Number.EPSILON) * 100) / 100;
}

/**
 * Line-item editor for a priced document.
 *
 * Every mutation is sent to the tenant API, which re-checks the workspace,
 * recalculates subtotal and total, and returns the authoritative document. The
 * browser never calculates the stored totals.
 */
export function DocumentLines({
  resourceKey,
  documentId,
  initialDocument,
  canEdit,
  products,
  lineLabel,
}: {
  resourceKey: DocumentKey;
  documentId: string;
  initialDocument: DocumentDetail;
  canEdit: boolean;
  products: FieldOption[];
  lineLabel: string;
}) {
  const [detail, setDetail] = useState(initialDocument);
  const [editor, setEditor] = useState<EditorState>(null);
  const [deleting, setDeleting] = useState<DocumentLineRow | null>(null);

  function applyDetail(next: DocumentDetail, message: string) {
    setDetail(next);
    toast.success(message);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Line items</h2>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {detail.lines.length === 0
              ? `No ${lineLabel.toLowerCase()}s recorded yet.`
              : `${detail.lines.length} ${lineLabel.toLowerCase()}${detail.lines.length === 1 ? "" : "s"} on this document.`}
          </p>
        </div>
        {canEdit ? (
          <Button size="sm" onClick={() => setEditor({ mode: "create", line: null })}>
            <PlusIcon aria-hidden="true" />
            Add {lineLabel.toLowerCase()}
          </Button>
        ) : null}
      </div>

      {canEdit ? (
        <details className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            How line items and totals work
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Add one line per product or service. The server multiplies quantity by
            unit price, applies the document tax and recalculates the subtotal,
            total, paid amount and balance. Client-side figures are only a preview.
          </p>
        </details>
      ) : null}

      <TableSurface>
        {detail.lines.length === 0 ? (
          <EmptyState
            icon={<ReceiptTextIcon aria-hidden="true" />}
            title={`No ${lineLabel.toLowerCase()}s yet`}
            description={
              canEdit
                ? "Add the first line to calculate the document subtotal and total on the server."
                : "A workspace member with update access can add line items."
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-border sm:hidden">
              {detail.lines.map((line) => (
                <li key={line.id} className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words text-foreground">
                        {line.description}
                      </p>
                      {line.productName ? (
                        <p className="mt-0.5 text-xs break-words text-muted-foreground">
                          {line.productName}
                        </p>
                      ) : null}
                    </div>
                    {canEdit ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Edit ${line.description}`}
                          onClick={() => setEditor({ mode: "edit", line })}
                        >
                          <PencilIcon aria-hidden="true" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Delete ${line.description}`}
                          onClick={() => setDeleting(line)}
                        >
                          <Trash2Icon aria-hidden="true" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Quantity</dt>
                      <dd className="mt-0.5 text-foreground tabular">
                        {formatNumber(line.quantity)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Unit price</dt>
                      <dd className="mt-0.5 text-foreground tabular">
                        {formatCurrency(line.unitPrice, detail.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Line total</dt>
                      <dd className="mt-0.5 font-medium text-foreground tabular">
                        {formatCurrency(line.total, detail.currency)}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            <div className="hidden sm:block">
              <Table aria-label={`${lineLabel} line items`}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden sm:table-cell">Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Unit price</TableHead>
                    <TableHead className="text-right">Line total</TableHead>
                    {canEdit ? <TableHead className="w-px text-right">Actions</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium text-foreground">
                        <div className="max-w-[18rem] break-words whitespace-normal">
                          {line.description}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {line.productName ?? "-"}
                      </TableCell>
                      <TableCell className="text-right tabular">
                        {formatNumber(line.quantity)}
                      </TableCell>
                      <TableCell className="hidden text-right tabular sm:table-cell">
                        {formatCurrency(line.unitPrice, detail.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular">
                        {formatCurrency(line.total, detail.currency)}
                      </TableCell>
                      {canEdit ? (
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Edit ${line.description}`}
                              onClick={() => setEditor({ mode: "edit", line })}
                            >
                              <PencilIcon aria-hidden="true" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Delete ${line.description}`}
                              onClick={() => setDeleting(line)}
                            >
                              <Trash2Icon aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <dl className="grid gap-2 border-t border-border bg-muted/30 px-4 py-3 text-sm sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-6">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium text-foreground tabular">
              {formatCurrency(detail.subtotal, detail.currency)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-6">
            <dt className="text-muted-foreground">Tax</dt>
            <dd className="font-medium text-foreground tabular">
              {formatCurrency(detail.tax, detail.currency)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-6">
            <dt className="font-medium text-foreground">Total</dt>
            <dd className="font-semibold text-foreground tabular">
              {formatCurrency(detail.total, detail.currency)}
            </dd>
          </div>
          {detail.amountPaid !== null ? (
            <>
              <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-6">
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="font-medium text-foreground tabular">
                  {formatCurrency(detail.amountPaid, detail.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-6">
                <dt className="text-muted-foreground">Balance</dt>
                <dd className="font-medium text-foreground tabular">
                  {formatCurrency(detail.balance ?? 0, detail.currency)}
                </dd>
              </div>
            </>
          ) : null}
        </dl>
      </TableSurface>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Totals are calculated on the server from the lines and the document tax. Last
        updated {formatDate(detail.updatedAt)}.
      </p>

      {editor ? (
        <LineDialog
          resourceKey={resourceKey}
          documentId={documentId}
          line={editor.line}
          products={products}
          lineLabel={lineLabel}
          onClose={() => setEditor(null)}
          onSaved={(next, message) => {
            setEditor(null);
            applyDetail(next, message);
          }}
        />
      ) : null}

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        {deleting ? (
          <DeleteLineDialog
            resourceKey={resourceKey}
            documentId={documentId}
            line={deleting}
            onCancel={() => setDeleting(null)}
            onDeleted={(next) => {
              setDeleting(null);
              applyDetail(next, "Line deleted and totals recalculated.");
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

function LineDialog({
  resourceKey,
  documentId,
  line,
  products,
  lineLabel,
  onClose,
  onSaved,
}: {
  resourceKey: DocumentKey;
  documentId: string;
  line: DocumentLineRow | null;
  products: FieldOption[];
  lineLabel: string;
  onClose: () => void;
  onSaved: (detail: DocumentDetail, message: string) => void;
}) {
  const [values, setValues] = useState<FormValues>(() => ({
    description: line?.description ?? "",
    productId: line?.productId ?? "",
    quantity: line ? String(line.quantity) : "1",
    unitPrice: line ? String(line.unitPrice) : "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);

  const isEditing = line !== null;

  function setValue(name: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    setFormError(null);

    const nextErrors: Record<string, string> = {};
    if (!values.description.trim()) {
      nextErrors.description = "A description is required.";
    }
    const quantity = Number(values.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      nextErrors.quantity = "Quantity must be greater than zero.";
    }
    const unitPrice = Number(values.unitPrice);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      nextErrors.unitPrice = "Unit price must be zero or more.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    submittingRef.current = true;
    try {
      const response = await fetch(
        isEditing
          ? `/api/tenant/${resourceKey}/${documentId}/lines/${line.id}`
          : `/api/tenant/${resourceKey}/${documentId}/lines`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: values.description.trim(),
            productId: values.productId || null,
            quantity,
            unitPrice,
          }),
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        document?: DocumentDetail;
        error?: string;
      };

      if (!response.ok || !data.document) {
        setFormError(data.error ?? "The line could not be saved.");
        return;
      }

      onSaved(
        data.document,
        isEditing
          ? `${lineLabel} updated and totals recalculated.`
          : `${lineLabel} added and totals recalculated.`,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit ${lineLabel.toLowerCase()}` : `Add ${lineLabel.toLowerCase()}`}
          </DialogTitle>
          <DialogDescription>
            Quantities and prices are multiplied on the server, then the document totals are
            recalculated.
          </DialogDescription>
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
            <Field data-invalid={errors.description ? true : undefined}>
              <FieldLabel htmlFor="line-description">
                Description
                <span className="text-destructive" aria-hidden="true">
                  {" "}
                  *
                </span>
              </FieldLabel>
              <Input
                id="line-description"
                value={values.description}
                onChange={(event) => setValue("description", event.target.value)}
                placeholder="What is being charged?"
                aria-invalid={errors.description ? true : undefined}
                disabled={saving}
              />
              <FieldError>{errors.description}</FieldError>
            </Field>

            {products.length > 0 ? (
              <Field>
                <FieldLabel htmlFor="line-product">Catalogue product</FieldLabel>
                <Select
                  value={values.productId || NONE}
                  onValueChange={(next) => {
                    const productId = !next || next === NONE ? "" : String(next);
                    setValue("productId", productId);
                    if (productId && !values.description.trim()) {
                      const product = products.find((option) => option.value === productId);
                      if (product) setValue("description", product.label);
                    }
                  }}
                  disabled={saving}
                >
                  <SelectTrigger id="line-product" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value={NONE}>No linked product</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.value} value={product.value}>
                        {product.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Linking a product keeps reporting consistent; pricing is still entered
                  on this line.
                </FieldDescription>
              </Field>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={errors.quantity ? true : undefined}>
                <FieldLabel htmlFor="line-quantity">
                  Quantity
                  <span className="text-destructive" aria-hidden="true">
                    {" "}
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="line-quantity"
                  type="number"
                  min={0.001}
                  step="0.001"
                  inputMode="decimal"
                  value={values.quantity}
                  onChange={(event) => setValue("quantity", event.target.value)}
                  aria-invalid={errors.quantity ? true : undefined}
                  disabled={saving}
                />
                <FieldError>{errors.quantity}</FieldError>
              </Field>

              <Field data-invalid={errors.unitPrice ? true : undefined}>
                <FieldLabel htmlFor="line-unit-price">
                  Unit price
                  <span className="text-destructive" aria-hidden="true">
                    {" "}
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="line-unit-price"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={values.unitPrice}
                  onChange={(event) => setValue("unitPrice", event.target.value)}
                  aria-invalid={errors.unitPrice ? true : undefined}
                  disabled={saving}
                />
                <FieldError>{errors.unitPrice}</FieldError>
              </Field>
            </div>

            <p className="text-sm text-muted-foreground">
              Line total:{" "}
              <span className="font-medium text-foreground tabular">
                {formatNumber(lineTotal(values))}
              </span>
            </p>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
              {saving ? "Saving…" : isEditing ? "Save line" : "Add line"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteLineDialog({
  resourceKey,
  documentId,
  line,
  onCancel,
  onDeleted,
}: {
  resourceKey: DocumentKey;
  documentId: string;
  line: DocumentLineRow;
  onCancel: () => void;
  onDeleted: (detail: DocumentDetail) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deletingRef = useRef(false);

  async function remove() {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/tenant/${resourceKey}/${documentId}/lines/${line.id}`,
        { method: "DELETE" },
      );
      const data = (await response.json().catch(() => ({}))) as {
        document?: DocumentDetail;
        error?: string;
      };

      if (!response.ok || !data.document) {
        setError(data.error ?? "The line could not be deleted.");
        return;
      }

      onDeleted(data.document);
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
        <DialogTitle>Delete this line?</DialogTitle>
        <DialogDescription>
          “{line.description}” will be removed and the document totals recalculated. This
          cannot be undone.
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
          Delete line
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
