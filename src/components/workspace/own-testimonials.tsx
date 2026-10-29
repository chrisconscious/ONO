"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, PencilIcon, ShieldOffIcon, StarIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/app/status-badge";
import { formatDate } from "@/lib/format";

export type OwnTestimonial = {
  id: string;
  quote: string;
  rating: number;
  status: string;
  authorName: string;
  authorTitle: string | null;
  company: string | null;
  consentToPublish: boolean;
  consentName: boolean;
  consentTitle: boolean;
  consentCompany: boolean;
  rejectionReason: string | null;
  publishedAt: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

/**
 * The author's own submissions with the actions they are allowed to take:
 * revising a returned submission and withdrawing publication consent.
 */
export function OwnTestimonials({ testimonials }: { testimonials: OwnTestimonial[] }) {
  const router = useRouter();
  const [withdrawing, setWithdrawing] = useState<OwnTestimonial | null>(null);
  const [revising, setRevising] = useState<OwnTestimonial | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    authorName: "",
    authorTitle: "",
    quote: "",
    rating: 5,
    consentName: true,
    consentTitle: true,
    consentCompany: true,
  });

  function startRevise(item: OwnTestimonial) {
    setError(null);
    setDraft({
      authorName: item.authorName,
      authorTitle: item.authorTitle ?? "",
      quote: item.quote,
      rating: item.rating,
      consentName: item.consentName,
      consentTitle: item.consentTitle,
      consentCompany: item.consentCompany,
    });
    setRevising(item);
  }

  async function withdrawConsent() {
    if (!withdrawing) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/testimonials/${withdrawing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw_consent" }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Consent could not be withdrawn.");
        return;
      }
      toast.success("Consent withdrawn. The testimonial is no longer public.");
      setWithdrawing(null);
      router.refresh();
    } catch {
      setError("Consent could not be withdrawn. Check your connection and retry.");
    } finally {
      setPending(false);
    }
  }

  async function resubmit() {
    if (!revising) return;
    if (draft.quote.trim().length < 20) {
      setError("Write at least 20 characters.");
      return;
    }
    if (draft.authorName.trim().length < 2) {
      setError("Provide your display name.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/testimonials/${revising.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revise",
          authorName: draft.authorName.trim(),
          authorTitle: draft.authorTitle.trim(),
          quote: draft.quote.trim(),
          rating: draft.rating,
          consentToPublish: true,
          consentName: draft.consentName,
          consentTitle: draft.consentTitle,
          consentCompany: draft.consentCompany,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "The testimonial could not be resubmitted.");
        return;
      }
      toast.success("Testimonial resubmitted for review.");
      setRevising(null);
      router.refresh();
    } catch {
      setError("The testimonial could not be resubmitted. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  if (testimonials.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You have not submitted a testimonial yet. Submissions and their moderation
        status appear here.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-border">
        {testimonials.map((item) => {
          const canRevise =
            item.status === "CHANGES_REQUESTED" || item.status === "REJECTED";

          return (
            <li key={item.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-0.5"
                    role="img"
                    aria-label={`Rated ${item.rating} out of 5`}
                  >
                    {Array.from({ length: 5 }).map((_, index) => (
                      <StarIcon
                        key={index}
                        aria-hidden="true"
                        className={
                          index < item.rating
                            ? "size-3.5 fill-warning text-warning"
                            : "size-3.5 text-border"
                        }
                      />
                    ))}
                  </span>
                  <StatusBadge status={item.status} />
                  {item.publishedAt ? (
                    <StatusBadge status="PUBLISHED" label="Published" />
                  ) : null}
                  {!item.consentToPublish ? (
                    <StatusBadge status="PENDING" label="Consent withdrawn" tone="danger" />
                  ) : null}
                </div>
                <span className="text-xs text-muted-foreground">
                  Submitted {formatDate(item.createdAt)}
                </span>
              </div>

              <blockquote className="text-sm leading-relaxed text-foreground">
                “{item.quote}”
              </blockquote>

              {item.rejectionReason ? (
                <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-foreground">
                  <span className="font-medium">Moderator note: </span>
                  {item.rejectionReason}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                {canRevise ? (
                  <Button size="sm" variant="outline" onClick={() => startRevise(item)}>
                    <PencilIcon />
                    Revise and resubmit
                  </Button>
                ) : null}
                {item.consentToPublish ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      setWithdrawing(item);
                    }}
                  >
                    <ShieldOffIcon />
                    Withdraw publication consent
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Publication consent withdrawn. This testimonial cannot be published.
                  </span>
                )}
                {item.publishedAt ? (
                  <span className="text-xs text-muted-foreground">
                    Public since {formatDate(item.publishedAt)}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={withdrawing !== null}
        onOpenChange={(value) => {
          if (!value) setWithdrawing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw publication consent?</DialogTitle>
            <DialogDescription>
              The testimonial is removed from the public page immediately. The
              submission and its moderation history are retained, and you cannot
              re-publish it yourself.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawing(null)}>
              Keep consent
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => void withdrawConsent()}
            >
              {pending ? <Loader2Icon className="animate-spin" /> : null}
              Withdraw consent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={revising !== null}
        onOpenChange={(value) => {
          if (!value) setRevising(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Revise and resubmit</DialogTitle>
            <DialogDescription>
              Address the moderator&apos;s note. Resubmitting returns the testimonial
              to the pending queue; publication still requires platform approval.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="revise-quote">Testimonial</FieldLabel>
              <Textarea
                id="revise-quote"
                rows={5}
                maxLength={600}
                value={draft.quote}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, quote: event.target.value }))
                }
              />
              <FieldDescription>{draft.quote.trim().length}/600 characters</FieldDescription>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="revise-name">Display name</FieldLabel>
                <Input
                  id="revise-name"
                  value={draft.authorName}
                  maxLength={120}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      authorName: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="revise-title">Role or title</FieldLabel>
                <Input
                  id="revise-title"
                  value={draft.authorTitle}
                  maxLength={120}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      authorTitle: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="revise-rating">Rating</FieldLabel>
              <Input
                id="revise-rating"
                type="number"
                min={1}
                max={5}
                value={draft.rating}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    rating: Math.max(1, Math.min(5, Number(event.target.value) || 1)),
                  }))
                }
              />
            </Field>
            <Field className="rounded-lg border border-border p-3">
              <FieldLabel>Identifying information to show publicly</FieldLabel>
              <div className="mt-1 grid gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.consentName}
                    onCheckedChange={(checked) =>
                      setDraft((current) => ({ ...current, consentName: checked === true }))
                    }
                  />
                  Show my display name
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.consentTitle}
                    onCheckedChange={(checked) =>
                      setDraft((current) => ({ ...current, consentTitle: checked === true }))
                    }
                  />
                  Show my role or title
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.consentCompany}
                    onCheckedChange={(checked) =>
                      setDraft((current) => ({ ...current, consentCompany: checked === true }))
                    }
                  />
                  Show my company name
                </label>
              </div>
            </Field>
            {error ? <FieldError>{error}</FieldError> : null}
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRevising(null)}>
              Cancel
            </Button>
            <Button disabled={pending} onClick={() => void resubmit()}>
              {pending ? <Loader2Icon className="animate-spin" /> : null}
              Resubmit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
