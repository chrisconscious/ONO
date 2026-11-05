"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  SendIcon,
  StarIcon,
  TrashIcon,
  UploadIcon,
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  AuthPageAdminState,
  AuthPageDraftView,
  AuthPageView,
} from "@/server/services/platform/auth-page.service";

export type AuthPageTestimonial = {
  id: string;
  authorName: string;
  authorTitle: string | null;
  company: string | null;
  quote: string;
  rating: number;
  displayOrder: number;
  isFeatured: boolean;
};

type DraftValues = {
  heading: string;
  supportingText: string;
  smallText: string;
  imageAlt: string;
};

type ContentErrors = Partial<Record<keyof DraftValues, string>>;

type TestimonialForm = {
  quote: string;
  authorName: string;
  authorTitle: string;
  company: string;
  rating: number;
};

const emptyTestimonial: TestimonialForm = {
  quote: "",
  authorName: "",
  authorTitle: "",
  company: "",
  rating: 5,
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function valuesFrom(draft: AuthPageDraftView): DraftValues {
  return {
    heading: draft.heading,
    supportingText: draft.supportingText,
    smallText: draft.smallText,
    imageAlt: draft.image.alt,
  };
}

function apiMessage(data: { error?: string }, fallback: string) {
  return data.error ?? fallback;
}

/**
 * Super Admin workspace for the global authentication page. Text and images are
 * saved to a private draft and only reach the public sign-in screen when
 * published; testimonial records use the existing moderated testimonial store.
 */
export function AuthPageSettings({
  initialDraft,
  initialPublished,
  initialTestimonials,
}: {
  initialDraft: AuthPageDraftView;
  initialPublished: AuthPageView;
  initialTestimonials: AuthPageTestimonial[];
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [published, setPublished] = useState(initialPublished);
  const [values, setValues] = useState<DraftValues>(() =>
    valuesFrom(initialDraft),
  );
  const [baseline, setBaseline] = useState<DraftValues>(() =>
    valuesFrom(initialDraft),
  );

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentErrors, setContentErrors] = useState<ContentErrors>({});

  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageDeleteOpen, setImageDeleteOpen] = useState(false);

  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [testimonialError, setTestimonialError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testimonialForm, setTestimonialForm] =
    useState<TestimonialForm>(emptyTestimonial);
  const [testimonialFormError, setTestimonialFormError] = useState<string | null>(
    null,
  );
  const [savingTestimonial, setSavingTestimonial] = useState(false);
  const [deleting, setDeleting] = useState<AuthPageTestimonial | null>(null);
  const [deletingTestimonial, setDeletingTestimonial] = useState(false);

  const [discardOpen, setDiscardOpen] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);

  const dirty =
    values.heading !== baseline.heading ||
    values.supportingText !== baseline.supportingText ||
    values.smallText !== baseline.smallText ||
    values.imageAlt !== baseline.imageAlt;

  const hasUnpublished = draft.hasDraft || dirty;

  function updateValue<K extends keyof DraftValues>(
    key: K,
    value: DraftValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setContentErrors((current) => ({ ...current, [key]: undefined }));
  }

  function applyDraft(next: AuthPageDraftView, syncForm = true) {
    setDraft(next);
    setPublished((current) => ({
      ...current,
      publishedAt: next.publishedAt,
    }));

    if (syncForm) {
      const nextValues = valuesFrom(next);
      setValues(nextValues);
      setBaseline(nextValues);
    }
  }

  function applyState(state: AuthPageAdminState) {
    setDraft(state.draft);
    setPublished(state.published);
    const nextValues = valuesFrom(state.draft);
    setValues(nextValues);
    setBaseline(nextValues);
  }

  async function readJson<T>(response: Response) {
    return (await response.json().catch(() => ({}))) as T & { error?: string };
  }

  function validateContent() {
    const nextErrors: ContentErrors = {};

    if (!values.heading.trim()) {
      nextErrors.heading = "Enter the authentication page heading.";
    } else if (values.heading.trim().length > 120) {
      nextErrors.heading = "Keep the heading to 120 characters or fewer.";
    }

    if (values.supportingText.trim().length > 240) {
      nextErrors.supportingText =
        "Keep the supporting text to 240 characters or fewer.";
    }

    if (values.smallText.trim().length > 120) {
      nextErrors.smallText = "Keep the small text to 120 characters or fewer.";
    }

    if (values.imageAlt.trim().length > 160) {
      nextErrors.imageAlt = "Keep the image description to 160 characters or fewer.";
    }

    setContentErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function saveDraft(options: { silent?: boolean } = {}) {
    if (!validateContent()) {
      setError("Check the highlighted fields before saving.");
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/auth-page", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heading: values.heading.trim(),
          supportingText: values.supportingText.trim(),
          smallText: values.smallText.trim(),
          imageAlt: values.imageAlt.trim(),
        }),
      });
      const data = await readJson<{ draft?: AuthPageDraftView }>(response);

      if (!response.ok || !data.draft) {
        setError(apiMessage(data, "The draft could not be saved."));
        return false;
      }

      applyDraft(data.draft);
      if (!options.silent) {
        toast.success("Draft saved. It is not public until you publish.");
      }
      return true;
    } catch {
      setError("We could not reach the server. Check your connection and retry.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function publishChanges() {
    if (!hasUnpublished) return;

    setError(null);
    if (dirty && !(await saveDraft({ silent: true }))) return;

    setPublishing(true);
    try {
      const response = await fetch("/api/admin/auth-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      const data = await readJson<{ state?: AuthPageAdminState }>(response);

      if (!response.ok || !data.state) {
        setError(apiMessage(data, "The changes could not be published."));
        return;
      }

      applyState(data.state);
      toast.success("Authentication page published.");
    } catch {
      setError("We could not reach the server. Check your connection and retry.");
    } finally {
      setPublishing(false);
    }
  }

  async function discardChanges() {
    setError(null);
    setDiscardOpen(false);

    try {
      const response = await fetch("/api/admin/auth-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discard" }),
      });
      const data = await readJson<{ state?: AuthPageAdminState }>(response);

      if (!response.ok || !data.state) {
        setError(apiMessage(data, "The draft could not be discarded."));
        return;
      }

      applyState(data.state);
      toast.success("Draft changes discarded.");
    } catch {
      setError("We could not reach the server. Check your connection and retry.");
    }
  }

  async function uploadImage(file: File) {
    setImageError(null);

    if (!acceptedImageTypes.has(file.type)) {
      setImageError("Choose a JPG, PNG or WebP image.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Images must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/admin/auth-page/image", {
        method: "POST",
        body,
      });
      const data = await readJson<{ draft?: AuthPageDraftView }>(response);

      if (!response.ok || !data.draft) {
        setImageError(apiMessage(data, "The image could not be uploaded."));
        return;
      }

      applyDraft(data.draft, false);
      toast.success("Image staged in the draft. Publish to make it live.");
    } catch {
      setImageError(
        "We could not reach the server. Check your connection and retry.",
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function removeDraftImage() {
    setImageError(null);
    try {
      const response = await fetch("/api/admin/auth-page/image", {
        method: "DELETE",
      });
      const data = await readJson<{ draft?: AuthPageDraftView }>(response);

      if (!response.ok || !data.draft) {
        setImageError(apiMessage(data, "The image could not be removed."));
        return;
      }

      applyDraft(data.draft, false);
      setImageDeleteOpen(false);
      toast.success("Image removed from the draft.");
    } catch {
      setImageError("We could not reach the server. Check your connection and retry.");
    }
  }

  async function restoreDefaultImage() {
    setImageError(null);
    try {
      const response = await fetch("/api/admin/auth-page/image", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore_default" }),
      });
      const data = await readJson<{ draft?: AuthPageDraftView }>(response);

      if (!response.ok || !data.draft) {
        setImageError(apiMessage(data, "The default image could not be restored."));
        return;
      }

      applyDraft(data.draft, false);
      toast.success("Default image staged in the draft.");
    } catch {
      setImageError("We could not reach the server. Check your connection and retry.");
    }
  }

  function openNewTestimonial() {
    setEditingId(null);
    setTestimonialForm(emptyTestimonial);
    setTestimonialFormError(null);
    setEditorOpen(true);
  }

  function openEditTestimonial(item: AuthPageTestimonial) {
    setEditingId(item.id);
    setTestimonialForm({
      quote: item.quote,
      authorName: item.authorName,
      authorTitle: item.authorTitle ?? "",
      company: item.company ?? "",
      rating: item.rating,
    });
    setTestimonialFormError(null);
    setEditorOpen(true);
  }

  async function saveTestimonial() {
    const quote = testimonialForm.quote.trim();
    const authorName = testimonialForm.authorName.trim();

    if (authorName.length < 2) {
      setTestimonialFormError("Enter the customer's display name.");
      return;
    }
    if (quote.length < 20) {
      setTestimonialFormError("Write at least 20 characters for the quotation.");
      return;
    }

    setSavingTestimonial(true);
    setTestimonialFormError(null);

    const payload = {
      authorName,
      authorTitle: testimonialForm.authorTitle.trim() || null,
      company: testimonialForm.company.trim() || null,
      quote,
      rating: Math.max(1, Math.min(5, Math.round(testimonialForm.rating))),
    };

    try {
      const response = editingId
        ? await fetch(`/api/admin/testimonials/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "edit", edits: payload }),
          })
        : await fetch("/api/admin/auth-page/testimonials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await readJson<{
        testimonial?: AuthPageTestimonial;
      }>(response);

      if (!response.ok || !data.testimonial) {
        setTestimonialFormError(
          apiMessage(data, "The testimonial could not be saved."),
        );
        return;
      }

      if (editingId) {
        setTestimonials((current) =>
          current.map((item) =>
            item.id === editingId ? { ...item, ...data.testimonial } : item,
          ),
        );
        toast.success("Testimonial updated.");
      } else {
        setTestimonials((current) => [...current, data.testimonial!]);
        toast.success("Testimonial added and published.");
      }

      setEditorOpen(false);
    } catch {
      setTestimonialFormError(
        "We could not reach the server. Check your connection and retry.",
      );
    } finally {
      setSavingTestimonial(false);
    }
  }

  async function deleteTestimonial() {
    if (!deleting) return;

    setDeletingTestimonial(true);
    setTestimonialError(null);

    try {
      const response = await fetch(`/api/admin/testimonials/${deleting.id}`, {
        method: "DELETE",
      });
      const data = await readJson<{ error?: string }>(response);

      if (!response.ok) {
        setTestimonialError(
          apiMessage(data, "The testimonial could not be removed."),
        );
        return;
      }

      setTestimonials((current) =>
        current.filter((item) => item.id !== deleting.id),
      );
      toast.success("Testimonial removed. The audit record is retained.");
      setDeleting(null);
    } catch {
      setTestimonialError(
        "We could not reach the server. Check your connection and retry.",
      );
    } finally {
      setDeletingTestimonial(false);
    }
  }

  async function moveTestimonial(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= testimonials.length || reordering) return;
    if (testimonials[index].isFeatured !== testimonials[target].isFeatured) {
      return;
    }

    const previous = testimonials;
    const next = [...testimonials];
    [next[index], next[target]] = [next[target], next[index]];

    setTestimonials(next);
    setReordering(true);
    setTestimonialError(null);

    try {
      const response = await fetch("/api/admin/testimonials/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((item) => item.id) }),
      });
      const data = await readJson<{ error?: string }>(response);

      if (!response.ok) {
        setTestimonials(previous);
        setTestimonialError(
          apiMessage(data, "The testimonial order could not be saved."),
        );
        return;
      }

      toast.success("Testimonial order updated.");
    } catch {
      setTestimonials(previous);
      setTestimonialError(
        "We could not reach the server. Check your connection and retry.",
      );
    } finally {
      setReordering(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-5 items-center rounded-full border border-success/25 bg-success/10 px-2 text-[0.7rem] font-medium text-foreground">
                Live page
              </span>
              <span className="text-xs text-muted-foreground">
                {published.publishedAt
                  ? `Last published ${formatDateTime(published.publishedAt)}`
                  : "Showing built-in default content"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {draft.hasDraft ? (
                <span className="inline-flex h-5 items-center rounded-full border border-warning/30 bg-warning/10 px-2 font-medium text-foreground">
                  Unpublished draft saved
                </span>
              ) : (
                <span className="text-muted-foreground">No saved draft</span>
              )}
              {dirty ? (
                <span className="inline-flex h-5 items-center rounded-full border border-border bg-muted/60 px-2 font-medium text-foreground">
                  Unsaved edits
                </span>
              ) : null}
            </div>
            <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
              Draft text and images are visible to platform administrators only.
              Publish to update the public sign-in and sign-up screens.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!hasUnpublished || saving || publishing}
              onClick={() => setDiscardOpen(true)}
            >
              Cancel changes
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!dirty || saving}
              onClick={() => void saveDraft()}
            >
              {saving ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <SaveIcon aria-hidden="true" />
              )}
              Save changes
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!hasUnpublished || publishing || saving}
              onClick={() => void publishChanges()}
            >
              {publishing ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <SendIcon aria-hidden="true" />
              )}
              Publish changes
            </Button>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
      </section>

      <Tabs defaultValue="content" className="gap-4">
        <TabsList variant="line" className="w-full justify-start border-b border-border">
          <TabsTrigger value="content" className="flex-none px-3">
            Text content
          </TabsTrigger>
          <TabsTrigger value="image" className="flex-none px-3">
            Image
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="flex-none px-3">
            Testimonials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <section className="rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
            <div className="mb-5 space-y-1">
              <h2 className="text-sm font-semibold text-foreground">
                Authentication page copy
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                These values appear beside the form on every authentication
                screen. The supporting description may be left empty.
              </p>
            </div>

            <FieldGroup>
              <Field data-invalid={Boolean(contentErrors.heading)}>
                <FieldLabel htmlFor="auth-heading">Main heading</FieldLabel>
                <Input
                  id="auth-heading"
                  value={values.heading}
                  maxLength={120}
                  onChange={(event) => updateValue("heading", event.target.value)}
                  aria-invalid={Boolean(contentErrors.heading)}
                  disabled={saving || publishing}
                />
                {contentErrors.heading ? (
                  <FieldError>{contentErrors.heading}</FieldError>
                ) : (
                  <FieldDescription>
                    {values.heading.trim().length}/120 characters.
                  </FieldDescription>
                )}
              </Field>

              <Field data-invalid={Boolean(contentErrors.supportingText)}>
                <FieldLabel htmlFor="auth-supporting">
                  Supporting description
                </FieldLabel>
                <Textarea
                  id="auth-supporting"
                  rows={3}
                  value={values.supportingText}
                  maxLength={240}
                  placeholder="Optional. Keep it short and useful."
                  onChange={(event) =>
                    updateValue("supportingText", event.target.value)
                  }
                  aria-invalid={Boolean(contentErrors.supportingText)}
                  disabled={saving || publishing}
                />
                {contentErrors.supportingText ? (
                  <FieldError>{contentErrors.supportingText}</FieldError>
                ) : (
                  <FieldDescription>
                    {values.supportingText.trim().length}/240 characters. Leave
                    empty to omit the line entirely.
                  </FieldDescription>
                )}
              </Field>

              <Field data-invalid={Boolean(contentErrors.smallText)}>
                <FieldLabel htmlFor="auth-small-text">Small footer text</FieldLabel>
                <Input
                  id="auth-small-text"
                  value={values.smallText}
                  maxLength={120}
                  onChange={(event) => updateValue("smallText", event.target.value)}
                  aria-invalid={Boolean(contentErrors.smallText)}
                  disabled={saving || publishing}
                />
                {contentErrors.smallText ? (
                  <FieldError>{contentErrors.smallText}</FieldError>
                ) : (
                  <FieldDescription>
                    {values.smallText.trim().length}/120 characters. Displayed
                    beside the copyright notice.
                  </FieldDescription>
                )}
              </Field>
            </FieldGroup>
          </section>
        </TabsContent>

        <TabsContent value="image">
          <section className="rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
            <div className="mb-4 space-y-1">
              <h2 className="text-sm font-semibold text-foreground">
                Authentication page image
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Uploaded images are stored privately and served through an
                authorized route. Nothing changes publicly until publication.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)]">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Draft preview
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {draft.image.source === "upload"
                      ? "Uploaded image"
                      : draft.image.source === "default"
                        ? "Default image"
                        : "No image"}
                  </span>
                </div>
                <div className="relative mt-2 aspect-[16/10] overflow-hidden rounded-xl border border-border bg-slate-900">
                  {draft.image.url ? (
                    <Image
                      src={draft.image.url}
                      alt={draft.image.alt}
                      fill
                      unoptimized={draft.image.source === "upload"}
                      sizes="(min-width: 1024px) 45vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#334155,#0f172a_65%)] px-6 text-center text-xs text-white/70">
                      No image selected. The panel uses a neutral gradient.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Currently live
                </h3>
                <div className="relative mt-2 aspect-video overflow-hidden rounded-xl border border-border bg-slate-900">
                  {published.image.url ? (
                    <Image
                      src={published.image.url}
                      alt={published.image.alt}
                      fill
                      unoptimized={published.image.source === "upload"}
                      sizes="(min-width: 1024px) 22vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#334155,#0f172a_65%)] text-xs text-white/70">
                      No live image
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {published.image.source === "upload"
                    ? "A custom image is live."
                    : published.image.source === "default"
                      ? "The bundled default image is live."
                      : "No image is shown on the live page."}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-foreground">Replace or remove</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                JPG, PNG or WebP up to 5 MB. The file signature is validated on
                the server before it is stored.
              </p>

              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadImage(file);
                }}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2Icon className="animate-spin" aria-hidden="true" />
                  ) : (
                    <UploadIcon aria-hidden="true" />
                  )}
                  {draft.image.source === "upload" ? "Replace image" : "Upload image"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void restoreDefaultImage()}
                  disabled={
                    uploading || draft.image.source === "default" || saving
                  }
                >
                  <RotateCcwIcon aria-hidden="true" />
                  Restore default
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => setImageDeleteOpen(true)}
                  disabled={uploading || draft.image.source === "none" || saving}
                >
                  <TrashIcon aria-hidden="true" />
                  Remove image
                </Button>
              </div>

              {uploading ? (
                <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />
                  Uploading and validating the image…
                </p>
              ) : null}

              {imageError ? (
                <p
                  role="alert"
                  className="mt-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  {imageError}
                </p>
              ) : null}
            </div>

            <Field className="mt-5" data-invalid={Boolean(contentErrors.imageAlt)}>
              <FieldLabel htmlFor="auth-image-alt">Image description</FieldLabel>
              <Input
                id="auth-image-alt"
                value={values.imageAlt}
                maxLength={160}
                placeholder="Describe the image for assistive technology"
                onChange={(event) => updateValue("imageAlt", event.target.value)}
                aria-invalid={Boolean(contentErrors.imageAlt)}
                disabled={saving || publishing}
              />
              {contentErrors.imageAlt ? (
                <FieldError>{contentErrors.imageAlt}</FieldError>
              ) : (
                <FieldDescription>
                  {values.imageAlt.trim().length}/160 characters. Leave empty when
                  the image is decorative.
                </FieldDescription>
              )}
            </Field>
          </section>
        </TabsContent>

        <TabsContent value="testimonials">
          <section className="rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-foreground">
                  Customer testimonials
                </h2>
                <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
                  Testimonials use the existing moderated testimonial store.
                  Published items appear in the authentication carousel
                  immediately; removal archives the record for the audit trail.
                </p>
              </div>
              <Button type="button" size="sm" onClick={openNewTestimonial}>
                <PlusIcon aria-hidden="true" />
                Add testimonial
              </Button>
            </div>

            {testimonialError ? (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {testimonialError}
              </p>
            ) : null}

            {testimonials.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-border px-6 py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  No published testimonials
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                  The authentication page shows a sample testimonial until a
                  customer story is published. Add one to replace it.
                </p>
              </div>
            ) : (
              <ol className="mt-4 space-y-3">
                {testimonials.map((item, index) => {
                  const previous = testimonials[index - 1];
                  const next = testimonials[index + 1];
                  const canMoveUp =
                    Boolean(previous) && previous.isFeatured === item.isFeatured;
                  const canMoveDown =
                    Boolean(next) && next.isFeatured === item.isFeatured;

                  return (
                    <li
                      key={item.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Stars rating={item.rating} />
                            <span className="text-xs text-muted-foreground tabular">
                              {item.rating}/5
                            </span>
                            {item.isFeatured ? (
                              <span className="inline-flex h-5 items-center rounded-full border border-primary/25 bg-primary/10 px-2 text-[0.7rem] font-medium text-primary">
                                Featured
                              </span>
                            ) : null}
                          </div>
                          <blockquote className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground">
                            “{item.quote}”
                          </blockquote>
                          <p className="mt-2 text-sm font-medium text-foreground">
                            {item.authorName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[item.authorTitle, item.company]
                              .filter(Boolean)
                              .join(" · ") || "No title or company shown"}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-1">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            aria-label={`Move ${item.authorName} earlier`}
                            title={canMoveUp ? "Move earlier" : "Cannot move across the featured group"}
                            disabled={!canMoveUp || reordering}
                            onClick={() => void moveTestimonial(index, -1)}
                          >
                            <ArrowUpIcon aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            aria-label={`Move ${item.authorName} later`}
                            title={canMoveDown ? "Move later" : "Cannot move across the featured group"}
                            disabled={!canMoveDown || reordering}
                            onClick={() => void moveTestimonial(index, 1)}
                          >
                            <ArrowDownIcon aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            aria-label={`Edit ${item.authorName}`}
                            onClick={() => openEditTestimonial(item)}
                          >
                            <PencilIcon aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="destructive"
                            aria-label={`Remove ${item.authorName}`}
                            onClick={() => setDeleting(item)}
                          >
                            <TrashIcon aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Star ratings use the stored value. Reordering is limited within the
              featured and non-featured groups because the public carousel always
              lists featured stories first.
            </p>
          </section>
        </TabsContent>
      </Tabs>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit testimonial" : "Add testimonial"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Corrections are saved to the published record immediately."
                : "New testimonials are published to the authentication page immediately."}
            </DialogDescription>
          </DialogHeader>

          {testimonialFormError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {testimonialFormError}
            </p>
          ) : null}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="testimonial-quote">Quotation</FieldLabel>
              <Textarea
                id="testimonial-quote"
                rows={5}
                value={testimonialForm.quote}
                maxLength={600}
                onChange={(event) =>
                  setTestimonialForm((current) => ({
                    ...current,
                    quote: event.target.value,
                  }))
                }
              />
              <FieldDescription>
                {testimonialForm.quote.trim().length}/600 characters, at least 20.
              </FieldDescription>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="testimonial-name">Customer name</FieldLabel>
                <Input
                  id="testimonial-name"
                  value={testimonialForm.authorName}
                  maxLength={120}
                  onChange={(event) =>
                    setTestimonialForm((current) => ({
                      ...current,
                      authorName: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="testimonial-title">Job title</FieldLabel>
                <Input
                  id="testimonial-title"
                  value={testimonialForm.authorTitle}
                  maxLength={120}
                  onChange={(event) =>
                    setTestimonialForm((current) => ({
                      ...current,
                      authorTitle: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="testimonial-company">Company</FieldLabel>
                <Input
                  id="testimonial-company"
                  value={testimonialForm.company}
                  maxLength={160}
                  onChange={(event) =>
                    setTestimonialForm((current) => ({
                      ...current,
                      company: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="testimonial-rating">Star rating</FieldLabel>
                <Input
                  id="testimonial-rating"
                  type="number"
                  min={1}
                  max={5}
                  value={testimonialForm.rating}
                  onChange={(event) =>
                    setTestimonialForm((current) => ({
                      ...current,
                      rating: Math.max(
                        1,
                        Math.min(5, Number(event.target.value) || 1),
                      ),
                    }))
                  }
                />
                <FieldDescription>Between 1 and 5 stars.</FieldDescription>
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditorOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={savingTestimonial}
              onClick={() => void saveTestimonial()}
            >
              {savingTestimonial ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : null}
              {editingId ? "Save changes" : "Add testimonial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={discardOpen}
        onOpenChange={(open) => {
          if (!open) setDiscardOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discard unpublished changes?</DialogTitle>
            <DialogDescription>
              The saved draft and any unsaved edits on this screen will be
              discarded. The live authentication page is not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDiscardOpen(false)}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void discardChanges()}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={imageDeleteOpen}
        onOpenChange={(open) => {
          if (!open) setImageDeleteOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove the draft image?</DialogTitle>
            <DialogDescription>
              The authentication panel will use a neutral gradient in the draft.
              The live image stays unchanged until you publish.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setImageDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void removeDraftImage()}
            >
              Remove image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this testimonial?</DialogTitle>
            <DialogDescription>
              {deleting
                ? `“${deleting.quote.slice(0, 120)}${deleting.quote.length > 120 ? "…" : ""}” by ${deleting.authorName}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The testimonial is removed from the authentication carousel. The
            record is archived rather than deleted so the moderation and audit
            history stays intact.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletingTestimonial}
              onClick={() => void deleteTestimonial()}
            >
              {deletingTestimonial ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : null}
              Remove testimonial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));

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
          className={cn(
            "size-3.5",
            index < clamped
              ? "fill-warning text-warning"
              : "text-border",
          )}
        />
      ))}
    </span>
  );
}
