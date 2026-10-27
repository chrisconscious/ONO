"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import { useWorkspaceBootstrap } from "@/components/shared/use-workspace";
import { api, ApiClientError } from "@/lib/api/client";

interface InvoiceRow {
  invoiceId: string;
  number: string;
  total: string;
  amountPaid: string;
  outstanding: string;
  dueDate: string | null;
  company?: { id: string; name: string } | null;
}

/**
 * Finance receivables/payables view. Payments are NEVER marked complete from
 * the browser: recording a payment calls POST /invoices/[id]/payments and the
 * UI only reflects the authoritative transition returned by the server.
 */
export default function InvoicesPage() {
  const workspace = useWorkspaceBootstrap();
  const [direction, setDirection] = useState<"receivable" | "payable">("receivable");
  const [refreshKey, setRefreshKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: "", quantity: "1", unitPrice: "" });
  const [saving, setSaving] = useState(false);
  const canWrite = workspace.can("finance.write");

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await api.post("/api/v1/invoices", {
        type: direction === "payable" ? "PURCHASE" : "SALES",
        lines: [{
          description: form.description,
          quantity: Number(form.quantity),
          unitPrice: Number(form.unitPrice),
        }],
      });
      toast.success("Invoice created as DRAFT");
      setOpen(false);
      setForm({ description: "", quantity: "1", unitPrice: "" });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not create invoice");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Receivables and payables from real invoice records.</p>
        </div>
        {canWrite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" aria-hidden="true" /> New invoice</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={createInvoice}>
                <DialogHeader>
                  <DialogTitle>New {direction === "payable" ? "purchase" : "sales"} invoice</DialogTitle>
                  <DialogDescription>Created as DRAFT; issuing and payments are validated by the server.</DialogDescription>
                </DialogHeader>
                <div className="my-4 grid gap-4">
                  <Field>
                    <FieldLabel htmlFor="inv-desc">Line description *</FieldLabel>
                    <Input id="inv-desc" required maxLength={300} value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="inv-qty">Quantity *</FieldLabel>
                      <Input id="inv-qty" type="number" min="0.01" step="0.01" required value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="inv-price">Unit price *</FieldLabel>
                      <Input id="inv-price" type="number" min="0" step="0.01" required value={form.unitPrice}
                        onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
                    </Field>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create draft"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={direction} onValueChange={(v) => setDirection(v as typeof direction)}>
        <TabsList>
          <TabsTrigger value="receivable">Receivables</TabsTrigger>
          <TabsTrigger value="payable">Payables</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable<InvoiceRow>
        key={direction}
        path={direction === "payable" ? "/api/v1/finance/payables" : "/api/v1/finance/receivables"}
        refreshKey={refreshKey}
        paginated={false}
        rowKey={(r) => r.invoiceId}
        columns={[
          { key: "number", header: "Number" },
          { key: "company", header: "Counterparty" },
          { key: "total", header: "Total", className: "text-right" },
          { key: "paid", header: "Paid", className: "text-right" },
          { key: "outstanding", header: "Outstanding", className: "text-right" },
          { key: "due", header: "Due" },
        ]}
        emptyTitle={direction === "payable" ? "No payables" : "No receivables"}
        renderRow={(r) => (
          <>
            <TableCell className="font-mono text-xs">{r.number}</TableCell>
            <TableCell>{r.company?.name ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">{Number(r.total).toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums">{Number(r.amountPaid).toLocaleString()}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">{Number(r.outstanding).toLocaleString()}</TableCell>
            <TableCell className="text-muted-foreground">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—"}</TableCell>
          </>
        )}
      />
    </div>
  );
}
