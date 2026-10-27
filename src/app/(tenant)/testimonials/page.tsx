"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Plus, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceBootstrap } from "@/components/shared/use-workspace";
import { api, ApiClientError } from "@/lib/api/client";

interface TestimonialRow {
  id: string;
  authorName: string;
  authorTitle: string;
  companyName: string;
  quote: string;
  rating: number | null;
  isPublished: boolean;
  publishedAt: string | null;
}

/**
 * Tenant view of testimonials attributed to the signed-in organization.
 *
 * Boundary note: testimonials are platform marketing content — only platform
 * admins may create/publish them (see /admin/testimonials). Tenant members can
 * view their own published entries and submit a nomination through the
 * consented submission endpoint; nothing here lets a tenant self-publish.
 */
export default function TenantTestimonialsPage() {
  const workspace = useWorkspaceBootstrap();
  const [rows, setRows] = useState<TestimonialRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ authorName: "", authorTitle: "", quote: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setError(null);
    try {
      setRows(await api.get<TestimonialRow[]>("/api/v1/testimonials"));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load testimonials.");
    }
  }

  // Initial load via effect below; `load` reused after mutations.
  useState(() => {
    if (workspace.tenantId) void load();
  });

  async function nominate(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await api.post("/api/v1/testimonials", {
        authorName: form.authorName,
        authorTitle: form.authorTitle,
        quote: form.quote,
      });
      toast.success("Thanks — your testimonial was submitted for platform review.");
      setOpen(false);
      setForm({ authorName: "", authorTitle: "", quote: "" });
      await load();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not submit testimonial");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Testimonials</h1>
          <p className="text-sm text-muted-foreground">
            Reviews attributed to your organization. Publication requires platform-admin approval.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline"><Plus className="size-4" aria-hidden="true" /> Nominate a testimonial</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={nominate}>
              <DialogHeader>
                <DialogTitle>Submit a testimonial for review</DialogTitle>
                <DialogDescription>
                  A platform administrator reviews and approves published content before it appears publicly.
                </DialogDescription>
              </DialogHeader>
              <div className="my-4 grid gap-4">
                <Field>
                  <FieldLabel htmlFor="t-author">Author name *</FieldLabel>
                  <Input id="t-author" required minLength={2} value={form.authorName}
                    onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="t-title">Author title *</FieldLabel>
                  <Input id="t-title" required minLength={2} value={form.authorTitle}
                    onChange={(e) => setForm({ ...form, authorTitle: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="t-quote">Quote *</FieldLabel>
                  <Textarea id="t-quote" required minLength={10} rows={4} value={form.quote}
                    onChange={(e) => setForm({ ...form, quote: e.target.value })} />
                </Field>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>{saving ? "Submitting…" : "Submit for review"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!rows && !error ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : rows && rows.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          No testimonials recorded for your organization yet.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows?.map((t) => (
            <Card key={t.id}>
              <CardContent className="space-y-2 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{t.authorName}</p>
                    <p className="text-xs text-muted-foreground">{t.authorTitle} · {t.companyName}</p>
                  </div>
                  <Badge variant={t.isPublished ? "default" : "outline"}>
                    {t.isPublished ? <Eye className="mr-1 size-3" aria-hidden="true" /> : <EyeOff className="mr-1 size-3" aria-hidden="true" />}
                    {t.isPublished ? "Published" : "In review"}
                  </Badge>
                </div>
                <blockquote className="text-sm text-muted-foreground">“{t.quote}”</blockquote>
                {t.isPublished && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ShieldCheck className="size-3" aria-hidden="true" />
                    Approved by platform moderation{t.publishedAt ? ` on ${new Date(t.publishedAt).toLocaleDateString()}` : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
