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
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/shared/data-table";
import { useWorkspaceBootstrap } from "@/components/shared/use-workspace";
import { api, ApiClientError } from "@/lib/api/client";

interface LeadRow {
  id: string;
  title: string;
  company: string | null;
  email: string | null;
  status: string;
  valueEstimate: string | number | null;
  createdAt: string;
  source?: { name: string } | null;
}

const STATUS_TONE: Record<string, "default" | "secondary" | "outline"> = {
  NEW: "secondary", CONTACTED: "outline", QUALIFIED: "default", CONVERTED: "default", LOST: "secondary",
};

/** CRM leads list with search, server pagination, create dialog, and convert action. */
export default function LeadsPage() {
  const workspace = useWorkspaceBootstrap();
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", email: "", phone: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const canWrite = workspace.can("crm.write");

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await api.post("/api/v1/leads", {
        title: form.title,
        ...(form.company && { company: form.company }),
        ...(form.email && { email: form.email }),
        ...(form.phone && { phone: form.phone }),
        ...(form.notes && { notes: form.notes }),
      });
      toast.success("Lead created");
      setOpen(false);
      setForm({ title: "", company: "", email: "", phone: "", notes: "" });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not create lead");
    } finally {
      setSaving(false);
    }
  }

  async function convertLead(id: string) {
    try {
      await api.post(`/api/v1/leads/${id}/convert`, {});
      toast.success("Lead converted to opportunity");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Conversion failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Prospective customers captured by your team.</p>
        </div>
        {canWrite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" aria-hidden="true" /> New lead</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={createLead}>
                <DialogHeader>
                  <DialogTitle>New lead</DialogTitle>
                  <DialogDescription>Creates a NEW-status lead in your organization.</DialogDescription>
                </DialogHeader>
                <div className="my-4 grid gap-4">
                  <Field>
                    <FieldLabel htmlFor="lead-title">Title *</FieldLabel>
                    <Input id="lead-title" required maxLength={200} value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="lead-company">Company</FieldLabel>
                    <Input id="lead-company" value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="lead-email">Email</FieldLabel>
                      <Input id="lead-email" type="email" value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="lead-phone">Phone</FieldLabel>
                      <Input id="lead-phone" value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="lead-notes">Notes</FieldLabel>
                    <Textarea id="lead-notes" rows={3} value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </Field>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create lead"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <DataTable<LeadRow>
        path="/api/v1/leads"
        query={{ search: search || undefined }}
        refreshKey={refreshKey}
        rowKey={(r) => r.id}
        columns={[
          { key: "title", header: "Lead" },
          { key: "company", header: "Company" },
          { key: "status", header: "Status" },
          { key: "source", header: "Source" },
          { key: "created", header: "Created" },
          { key: "actions", header: "" },
        ]}
        toolbar={
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input aria-label="Search leads" placeholder="Search title, company, email…" className="pl-9"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        }
        renderRow={(r) => (
          <>
            <TableCell className="font-medium">{r.title}</TableCell>
            <TableCell className="text-muted-foreground">{r.company ?? "—"}</TableCell>
            <TableCell><Badge variant={STATUS_TONE[r.status] ?? "outline"}>{r.status}</Badge></TableCell>
            <TableCell className="text-muted-foreground">{r.source?.name ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              {canWrite && (r.status === "QUALIFIED" || r.status === "CONTACTED") && (
                <Button size="sm" variant="outline" onClick={() => convertLead(r.id)}>Convert</Button>
              )}
            </TableCell>
          </>
        )}
      />
    </div>
  );
}
