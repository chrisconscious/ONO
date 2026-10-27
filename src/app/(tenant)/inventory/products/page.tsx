"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import { useWorkspaceBootstrap } from "@/components/shared/use-workspace";
import { api, ApiClientError } from "@/lib/api/client";

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  type: string;
  // Prisma Decimals serialize to strings over JSON.
  unitPrice: string;
  costPrice: string | null;
  reorderPoint: number;
}

/** Product catalog backed by GET/POST /api/v1/products (tenant-scoped). */
export default function ProductsPage() {
  const workspace = useWorkspaceBootstrap();
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ sku: "", name: "", unitPrice: "", type: "GOODS" });
  const [saving, setSaving] = useState(false);
  const canWrite = workspace.can("inventory.write");

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await api.post("/api/v1/products", {
        sku: form.sku,
        name: form.name,
        unitPrice: Number(form.unitPrice),
        type: form.type,
      });
      toast.success("Product created");
      setOpen(false);
      setForm({ sku: "", name: "", unitPrice: "", type: "GOODS" });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not create product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Catalog of goods and services you sell or stock.</p>
        </div>
        {canWrite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" aria-hidden="true" /> New product</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={createProduct}>
                <DialogHeader>
                  <DialogTitle>New product</DialogTitle>
                  <DialogDescription>SKU must be unique within your organization.</DialogDescription>
                </DialogHeader>
                <div className="my-4 grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="prod-sku">SKU *</FieldLabel>
                      <Input id="prod-sku" required pattern="[A-Za-z0-9._-]{1,40}" value={form.sku}
                        onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="prod-type">Type</FieldLabel>
                      <Input id="prod-type" list="prod-types" value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })} />
                      <datalist id="prod-types">
                        <option value="GOODS" /><option value="SERVICE" />
                      </datalist>
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="prod-name">Name *</FieldLabel>
                    <Input id="prod-name" required maxLength={200} value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="prod-price">Unit price *</FieldLabel>
                    <Input id="prod-price" type="number" min="0" step="0.01" required value={form.unitPrice}
                      onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
                  </Field>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <DataTable<ProductRow>
        path="/api/v1/products"
        query={{ search: search || undefined }}
        paginated={false}
        refreshKey={refreshKey}
        rowKey={(r) => r.id}
        columns={[
          { key: "sku", header: "SKU" },
          { key: "name", header: "Name" },
          { key: "type", header: "Type" },
          { key: "price", header: "Unit price", className: "text-right" },
          { key: "reorder", header: "Reorder point", className: "text-right" },
        ]}
        toolbar={
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input aria-label="Search products" placeholder="Search SKU or name…" className="pl-9"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        }
        renderRow={(r) => (
          <>
            <TableCell className="font-mono text-xs">{r.sku}</TableCell>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
            <TableCell className="text-right tabular-nums">{Number(r.unitPrice).toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums">{r.reorderPoint}</TableCell>
          </>
        )}
      />
    </div>
  );
}
