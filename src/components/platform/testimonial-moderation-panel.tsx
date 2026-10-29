"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveIcon,
  EyeIcon,
  Loader2Icon,
  PencilIcon,
  StarIcon,
  ThumbsUpIcon,
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
  DialogTrigger,
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
import { formatDateTime } from "@/lib/format";

export type ModerationTestimonial = {
  id: string;
  authorName: string;
  authorTitle: string | null;
  company: string | null;
  quote: string;
  rating: number;
  status: string;
  consentToPublish: boolean;
  consentName: boolean;
  consentTitle: boolean;
  consentCompany: boolean;
  rejectionReason: string | null;
  moderationNotes: string | null;
  isFeatured: boolean;
  displayOrder: number;
  publishedAt: string | null;
  archivedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  tenant: { id: string; name: string; slug: string } | null;
  submittedBy: { id: string; name: string | null; email: string } | null;
};

type HistoryEntry = {
  id: string;
  action: string;
  createdAt: string;
  metadata: unknown;
  user: { name: string | null; email: string } | null;
};

type ActionName =
  | "approve"
  | "reject"
  | "request_changes"
  | "publish"
  | "unpublish"
  | "feature"
  | "unfeature"
  | "archive";

const actionLabels: Record<string, string> = {
  approve: "Approved",
  reject: "Rejected",
  request_changes: "Changes requested",
  publish: "Published",
  unpublish: "Unpublished",
  feature: "Featured",
  unfeature: "Unfeatured",
  archive: "Archived",
  edit: "Edited",
  reorder: "Reordered",
};

const noteActions = new Set<ActionName>(["reject", "request_changes"]);

function Stars({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`Rated ${clamped} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          aria-hidden="true"
          className={
            index < clamped
              ? "size-3.5 fill-warning text-warning"
              : "size-3.5 text-border"
          }
        />
      ))}
    </span>
  );
}

/**
 * Moderation workspace for one testimonial. The dialog loads the audit-backed
 * history on demand and routes every transition through the platform API, which
 * re-validates consent and status before writing.
 */
export function TestimonialModerationPanel({
  testimonial: initial,
}: {
  testimonial: ModerationTestimonial;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [testimonial, setTestimonial] = useState(initial);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [confirmAction, setConfirmAction] = useState<ActionName | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);

  const [edits, setEdits] = useState({
    authorName: initial.authorName,
    authorTitle: initial.authorTitle ?? "",
    company: initial.company ?? "",
    quote: initial.quote,
    rating: initial.rating,
    displayOrder: initial.displayOrder,
  });

  async function loadDetail() {
    try {
      const response = await fetch(`/api/admin/testimonials/${initial.id}`);
      const data = (await response.json().catch(() => ({}))) as {
        testimonial?: ModerationTestimonial;
        history?: HistoryEntry[];
        error?: string;
      };
      if (!response.ok) {
        setHistoryError(data.error ?? "Unable to load moderation history.");
        return;
      }
      if (data.testimonial) {
        setTestimonial(data.testimonial);
        setEdits({
          authorName: data.testimonial.authorName,
          authorTitle: data.testimonial.authorTitle ?? "",
          company: data.testimonial.company ?? "",
          quote: data.testimonial.quote,
          rating: data.testimonial.rating,
          displayOrder: data.testimonial.displayOrder,
        });
      }
      setHistory(data.history ?? []);
    } catch {
      setHistoryError("Unable to load moderation history.");
    }
  }

  useEffect(() => {
    if (!open) return;
    // The fetch is scheduled after the effect body commits so the dialog paints
    // before history loads, and so state only changes in an async callback.
    void Promise.resolve().then(loadDetail);
    // Detail is refreshed every time the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function send(body: unknown, key: string) {
    setPending(key);
    setError(null);
    try {
      const response = await fetch(`/api/admin/testimonials/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => ({}))) as {
        testimonial?: ModerationTestimonial;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "The action could not be completed.");
        return false;
      }
      if (data.testimonial) setTestimonial(data.testimonial);
      toast.success("Testimonial updated.");
      router.refresh();
      void loadDetail();
      return true;
    } catch {
      setError("The action could not be completed. Check your connection.");
      return false;
    } finally {
      setPending(null);
    }
  }

  async function runAction(action: ActionName) {
    if (noteActions.has(action)) {
      setConfirmAction(action);
      setNote("");
      setNoteError(null);
      return;
    }

    if (action === "archive") {
      setConfirmAction("archive");
      return;
    }

    await send({ action }, action);
  }

  async function confirmWithNote() {
    if (!confirmAction) return;
    if (noteActions.has(confirmAction) && note.trim().length < 3) {
      setNoteError("Record at least three characters so the author understands.");
      return;
    }

    const body = noteActions.has(confirmAction)
      ? { action: confirmAction, note: note.trim() }
      : { action: confirmAction };

    const ok = await send(body, confirmAction);
    if (ok) {
      setConfirmAction(null);
      setNote("");
    }
  }

  async function saveEdits() {
    if (edits.quote.trim().length < 20) {
      setError("The testimonial must remain at least 20 characters.");
      return;
    }
    if (edits.authorName.trim().length < 2) {
      setError("Provide the author's display name.");
      return;
    }

    const ok = await send(
      {
        action: "edit",
        edits: {
          authorName: edits.authorName.trim(),
          authorTitle: edits.authorTitle.trim() || null,
          company: edits.company.trim() || null,
          quote: edits.quote.trim(),
          rating: edits.rating,
          displayOrder: edits.displayOrder,
        },
      },
      "edit",
    );

    if (ok) setEditing(false);
  }

  async function archive() {
    setPending("archive");
    setError(null);
    try {
      const response = await fetch(`/api/admin/testimonials/${initial.id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as {
        testimonial?: ModerationTestimonial;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "The testimonial could not be archived.");
        return;
      }
      if (data.testimonial) setTestimonial(data.testimonial);
      setConfirmAction(null);
      toast.success("Testimonial archived. The record is retained.");
      router.refresh();
      void loadDetail();
    } catch {
      setError("The testimonial could not be archived.");
    } finally {
      setPending(null);
    }
  }

  const isArchived = testimonial.status === "ARCHIVED";
  const isPublished = Boolean(testimonial.publishedAt);
  const canApprove = !isArchived && testimonial.status !== "APPROVED";
  const canPublish =
    testimonial.status === "APPROVED" && !isPublished && testimonial.consentToPublish;
  const canFeature = isPublished && !testimonial.isFeatured;

  const displayName = testimonial.consentName
    ? testimonial.authorName
    : "Verified customer";
  const displayTitle = testimonial.consentTitle ? testimonial.authorTitle : null;
  const displayCompany = testimonial.consentCompany ? testimonial.company : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setHistoryError(null);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <EyeIcon aria-hidden="true" />
        Review
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Testimonial review
            <StatusBadge status={testimonial.status} />
            {testimonial.isFeatured ? (
              <span className="inline-flex h-5 items-center rounded-full border border-primary/25 bg-primary/10 px-2 text-[0.7rem] font-medium text-primary">
                Featured
              </span>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            {testimonial.tenant ? testimonial.tenant.name : "Platform submission"} ·
            submitted {formatDateTime(testimonial.createdAt)}
            {testimonial.publishedAt
              ? ` · published ${formatDateTime(testimonial.publishedAt)}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        <section aria-labelledby="public-preview-heading" className="space-y-2">
          <h3 id="public-preview-heading" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Public card preview
          </h3>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <Stars value={testimonial.rating} />
            <blockquote className="mt-2 text-sm leading-relaxed text-foreground">
              “{testimonial.quote}”
            </blockquote>
            <p className="mt-3 text-sm font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {[displayTitle, displayCompany].filter(Boolean).join(" · ") ||
                "No identifying details will be shown"}
            </p>
            {!testimonial.consentToPublish ? (
              <p className="mt-3 rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-xs text-muted-foreground">
                The author has not consented to publication. This card cannot be
                published.
              </p>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="details-heading" className="space-y-2">
          <h3 id="details-heading" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Submission details
          </h3>
          <dl className="grid gap-2 rounded-lg border border-border p-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Submitter</dt>
              <dd className="text-foreground">
                {testimonial.submittedBy?.name ?? "Unknown member"}
                {testimonial.submittedBy ? (
                  <span className="block text-xs text-muted-foreground">
                    {testimonial.submittedBy.email}
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Consent</dt>
              <dd className="text-foreground">
                {testimonial.consentToPublish ? "Publication granted" : "Not granted"}
              </dd>
              <dd className="text-xs text-muted-foreground">
                Name {testimonial.consentName ? "shown" : "hidden"} · Title{" "}
                {testimonial.consentTitle ? "shown" : "hidden"} · Company{" "}
                {testimonial.consentCompany ? "shown" : "hidden"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Reviewer</dt>
              <dd className="text-foreground">
                {testimonial.reviewedAt
                  ? `Reviewed ${formatDateTime(testimonial.reviewedAt)}`
                  : "Not reviewed yet"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Display order</dt>
              <dd className="text-foreground tabular">{testimonial.displayOrder}</dd>
            </div>
            {testimonial.rejectionReason ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">
                  Reason shared with the author
                </dt>
                <dd className="text-foreground">{testimonial.rejectionReason}</dd>
              </div>
            ) : null}
            {testimonial.archivedAt ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Archived</dt>
                <dd className="text-foreground">
                  {formatDateTime(testimonial.archivedAt)} · retained for audit
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section aria-labelledby="actions-heading" className="space-y-2">
          <h3 id="actions-heading" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Moderation actions
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={!canApprove || pending !== null}
              title={
                isArchived
                  ? "Archived testimonials cannot be approved."
                  : testimonial.status === "APPROVED"
                    ? "Already approved."
                    : !testimonial.consentToPublish
                      ? "The author has not consented to publication."
                      : undefined
              }
              onClick={() => void runAction("approve")}
            >
              {pending === "approve" ? <Loader2Icon className="animate-spin" /> : <ThumbsUpIcon />}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending !== null || isArchived}
              onClick={() => void runAction("request_changes")}
            >
              Request changes
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending !== null || isArchived}
              onClick={() => void runAction("reject")}
            >
              Reject
            </Button>
            {isPublished ? (
              <Button
                size="sm"
                variant="outline"
                disabled={pending !== null}
                onClick={() => void runAction("unpublish")}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={!canPublish || pending !== null}
                title={
                  testimonial.status !== "APPROVED"
                    ? "Only approved testimonials can be published."
                    : !testimonial.consentToPublish
                      ? "The author has not consented to publication."
                      : undefined
                }
                onClick={() => void runAction("publish")}
              >
                Publish
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={pending !== null || (!canFeature && !testimonial.isFeatured)}
              title={isPublished ? undefined : "Only published testimonials can be featured."}
              onClick={() =>
                void runAction(testimonial.isFeatured ? "unfeature" : "feature")
              }
            >
              {testimonial.isFeatured ? "Unfeature" : "Feature"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending !== null || isArchived}
              onClick={() => void runAction("archive")}
            >
              <ArchiveIcon />
              Archive
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending !== null}
              onClick={() => setEditing((value) => !value)}
            >
              <PencilIcon />
              {editing ? "Close editor" : "Edit content"}
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Approval and publication are separate. Editing is limited to display
            corrections and must not change the author&apos;s meaning. Archived
            records stay available to the audit trail.
          </p>
        </section>

        {editing ? (
          <section aria-labelledby="edit-heading" className="space-y-3 rounded-lg border border-border p-3">
            <h3 id="edit-heading" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Edit content and display identity
            </h3>
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel htmlFor={`quote-${testimonial.id}`}>Testimonial</FieldLabel>
                <Textarea
                  id={`quote-${testimonial.id}`}
                  rows={4}
                  value={edits.quote}
                  maxLength={600}
                  onChange={(event) =>
                    setEdits((current) => ({ ...current, quote: event.target.value }))
                  }
                />
                <FieldDescription>
                  {edits.quote.trim().length}/600 characters. Keep the original meaning.
                </FieldDescription>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`name-${testimonial.id}`}>Display name</FieldLabel>
                  <Input
                    id={`name-${testimonial.id}`}
                    value={edits.authorName}
                    maxLength={120}
                    onChange={(event) =>
                      setEdits((current) => ({
                        ...current,
                        authorName: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`title-${testimonial.id}`}>Display title</FieldLabel>
                  <Input
                    id={`title-${testimonial.id}`}
                    value={edits.authorTitle}
                    maxLength={120}
                    onChange={(event) =>
                      setEdits((current) => ({
                        ...current,
                        authorTitle: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`company-${testimonial.id}`}>Company</FieldLabel>
                  <Input
                    id={`company-${testimonial.id}`}
                    value={edits.company}
                    maxLength={160}
                    onChange={(event) =>
                      setEdits((current) => ({
                        ...current,
                        company: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`rating-${testimonial.id}`}>Rating</FieldLabel>
                  <Input
                    id={`rating-${testimonial.id}`}
                    type="number"
                    min={1}
                    max={5}
                    value={edits.rating}
                    onChange={(event) =>
                      setEdits((current) => ({
                        ...current,
                        rating: Math.max(1, Math.min(5, Number(event.target.value) || 1)),
                      }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`order-${testimonial.id}`}>Display order</FieldLabel>
                  <Input
                    id={`order-${testimonial.id}`}
                    type="number"
                    min={0}
                    max={9999}
                    value={edits.displayOrder}
                    onChange={(event) =>
                      setEdits((current) => ({
                        ...current,
                        displayOrder: Math.max(0, Number(event.target.value) || 0),
                      }))
                    }
                  />
                  <FieldDescription>
                    Lower numbers appear first among featured testimonials.
                  </FieldDescription>
                </Field>
              </div>
            </FieldGroup>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" disabled={pending !== null} onClick={() => void saveEdits()}>
                {pending === "edit" ? <Loader2Icon className="animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="history-heading" className="space-y-2">
          <h3 id="history-heading" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Moderation and publication history
          </h3>
          {historyError ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{historyError}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setHistory(null);
                  void loadDetail();
                }}
              >
                Retry
              </Button>
            </div>
          ) : history === null ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
              Loading history…
            </p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No moderation events recorded yet.
            </p>
          ) : (
            <ol className="space-y-2">
              {history.map((entry) => {
                const metadata =
                  entry.metadata && typeof entry.metadata === "object"
                    ? (entry.metadata as Record<string, unknown>)
                    : null;
                const actionKey =
                  typeof metadata?.action === "string" ? metadata.action : null;
                return (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {actionKey
                          ? (actionLabels[actionKey] ?? actionKey)
                          : entry.action}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.user?.name ?? entry.user?.email ?? "System"}
                    </p>
                    {typeof metadata?.note === "string" ? (
                      <p className="mt-1 text-xs text-foreground">{metadata.note}</p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(value) => {
          if (!value) setConfirmAction(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "archive"
                ? "Archive this testimonial?"
                : confirmAction === "reject"
                  ? "Reject this testimonial"
                  : "Request changes"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "archive"
                ? "The testimonial is removed from public display and retained in the moderation record. This cannot be undone from the interface."
                : "The author sees this reason in their workspace. Record a specific, respectful explanation."}
            </DialogDescription>
          </DialogHeader>

          {confirmAction && noteActions.has(confirmAction) ? (
            <Field>
              <FieldLabel htmlFor="moderation-note">Reason</FieldLabel>
              <Textarea
                id="moderation-note"
                rows={4}
                maxLength={500}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                aria-invalid={noteError ? true : undefined}
              />
              <FieldError>{noteError}</FieldError>
            </Field>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            {confirmAction === "archive" ? (
              <Button
                variant="destructive"
                disabled={pending === "archive"}
                onClick={() => void archive()}
              >
                {pending === "archive" ? <Loader2Icon className="animate-spin" /> : null}
                Archive
              </Button>
            ) : (
              <Button
                disabled={pending === confirmAction}
                onClick={() => void confirmWithNote()}
              >
                {pending === confirmAction ? <Loader2Icon className="animate-spin" /> : null}
                Confirm
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
