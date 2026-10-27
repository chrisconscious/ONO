"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { useWorkspaceBootstrap } from "@/components/shared/use-workspace";
import { api, ApiClientError } from "@/lib/api/client";

interface OpportunityRow {
  id: string;
  name: string;
  stage: string;
  amount: string | number;
  currency: string;
  expectedCloseDate: string | null;
  createdAt: string;
}

const STAGES = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;

/** Sales pipeline list with create dialog and server-validated stage moves. */
export default function OpportunitiesPage() {
  const workspace = useWorkspaceBootstrap();
  const [refreshKey, setRefreshKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "" });
  const [saving, setSaving] = useState(false);
  const canWrite = workspace.can("sales.write");

  async function createOpportunity(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await api.post("/api/v1/opportunities", {
        name: form.name,
        ...(form.amount && { amount: Number(form.amount) }),
      });
      toast.success("Opportunity created");
      setOpen(false);
      setForm({ name: "", amount: "" });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not create opportunity");
    } finally {
      setSaving(false);
    }
  }

  async function moveStage(id: string, stage: string) {
    try {
      // The backend enforces valid transitions; invalid moves surface as errors.
      await api.post(`/api/v1/opportunities/${id}/stage`, { stage });
      toast.success(`Moved to ${stage}`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Stage change rejected");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Opportunities</h1>
          <p className="text-sm text-muted-foreground">Sales pipeline across all stages.</p>
        </div>
        {canWrite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" aria-hidden="true" /> New opportunity</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={createOpportunity}>
                <DialogHeader>
                  <DialogTitle>New opportunity</DialogTitle>
                  <DialogDescription>Starts in the LEAD stage; the server validates every transition.</DialogDescription>
                </DialogHeader>
                <div className="my-4 grid gap-4">
                  <Field>
                    <FieldLabel htmlFor="opp-name">Name *</FieldLabel>
                    <Input id="opp-name" required maxLength={200} value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="opp-amount">Amount</FieldLabel>
                    <Input id="opp-amount" type="number" min="0" step="0.01" value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })} />
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

      <DataTable<OpportunityRow>
        path="/api/v1/opportunities"
        refreshKey={refreshKey}
        rowKey={(r) => r.id}
        columns={[
          { key: "name", header: "Opportunity" },
          { key: "stage", header: "Stage" },
          { key: "amount", header: "Amount", className: "text-right" },
          { key: "close", header: "Expected close" },
          { key: "actions", header: "" },
        ]}
        renderRow={(r) => (
          <>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell><Badge variant={r.stage === "WON" ? "default" : r.stage === "LOST" ? "secondary" : "outline"}>{r.stage}</Badge></TableCell>
            <TableCell className="text-right tabular-nums">{Number(r.amount).toLocaleString()} {r.currency}</TableCell>
            <TableCell className="text-muted-foreground">
              {r.expectedCloseDate ? new Date(r.expectedCloseDate).toLocaleDateString() : "—"}
            </TableCell>
            <TableCell className="text-right">
              {canWrite && r.stage !== "WON" && r.stage !== "LOST" && (
                <Select onValueChange={(v) => moveStage(r.id, v)}>
                  <SelectTrigger size="sm" className="w-32" aria-label={`Move ${r.name} stage`}>
                    <SelectValue placeholder="Move to…" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.filter((s) => s !== r.stage).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </TableCell>
          </>
        )}
      />
    </div>
  );
}
