"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2Icon, Loader2Icon, SendIcon, StarIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FormErrors = {
  authorName?: string;
  quote?: string;
  rating?: string;
  consentToPublish?: string;
  form?: string;
};

/**
 * Tenant member submission form. The company identity shown here is derived on
 * the server from the active membership; the browser never sends a tenant id.
 */
export function TestimonialSubmissionForm({
  defaultAuthorName,
  company,
}: {
  defaultAuthorName: string;
  company: string;
}) {
  const router = useRouter();
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [authorTitle, setAuthorTitle] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [consentToPublish, setConsentToPublish] = useState(false);
  const [consentName, setConsentName] = useState(true);
  const [consentTitle, setConsentTitle] = useState(true);
  const [consentCompany, setConsentCompany] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const next: FormErrors = {};
    if (authorName.trim().length < 2) next.authorName = "Provide your display name.";
    if (quote.trim().length < 20) next.quote = "Write at least 20 characters.";
    if (quote.trim().length > 600) next.quote = "Keep the testimonial under 600 characters.";
    if (rating < 1 || rating > 5) next.rating = "Choose a rating from 1 to 5 stars.";
    if (!consentToPublish) {
      next.consentToPublish = "Publication consent is required to submit a testimonial.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    setPending(true);
    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: authorName.trim(),
          authorTitle: authorTitle.trim(),
          quote: quote.trim(),
          rating,
          consentToPublish,
          consentName,
          consentTitle,
          consentCompany,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setErrors({ form: data.error ?? "The testimonial could not be submitted." });
        return;
      }

      setSubmitted(true);
      setQuote("");
      setAuthorTitle("");
      setRating(5);
      setConsentToPublish(false);
      toast.success("Testimonial submitted for review.");
      router.refresh();
    } catch {
      setErrors({
        form: "The testimonial could not be submitted. Check your connection and retry.",
      });
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-success/25 bg-success/5 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CheckCircle2Icon className="size-4 text-success" aria-hidden="true" />
          Submitted for review
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your testimonial is now pending platform moderation. You can follow its
          status below. It will only appear publicly if it is approved, published
          and you keep publication consent.
        </p>
        <Button size="sm" variant="outline" onClick={() => setSubmitted(false)}>
          Submit another testimonial
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={errors.authorName ? true : undefined}>
            <FieldLabel htmlFor="testimonial-author">Display name</FieldLabel>
            <Input
              id="testimonial-author"
              value={authorName}
              maxLength={120}
              onChange={(event) => setAuthorName(event.target.value)}
              aria-invalid={errors.authorName ? true : undefined}
            />
            <FieldError>{errors.authorName}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="testimonial-title">Role or title (optional)</FieldLabel>
            <Input
              id="testimonial-title"
              value={authorTitle}
              maxLength={120}
              placeholder="e.g. Operations Director"
              onChange={(event) => setAuthorTitle(event.target.value)}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="testimonial-company">Company</FieldLabel>
          <Input id="testimonial-company" value={company} readOnly disabled />
          <FieldDescription>
            Your authorised company identity comes from your active workspace
            membership and cannot be changed here.
          </FieldDescription>
        </Field>

        <Field data-invalid={errors.rating ? true : undefined}>
          <FieldLabel>Rating</FieldLabel>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                onClick={() => setRating(value)}
                className="rounded-md p-1 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <StarIcon
                  aria-hidden="true"
                  className={cn(
                    "size-6",
                    value <= rating
                      ? "fill-warning text-warning"
                      : "text-border",
                  )}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">{rating} of 5</span>
          </div>
          <FieldError>{errors.rating}</FieldError>
        </Field>

        <Field data-invalid={errors.quote ? true : undefined}>
          <FieldLabel htmlFor="testimonial-quote">Your testimonial</FieldLabel>
          <Textarea
            id="testimonial-quote"
            rows={5}
            maxLength={600}
            value={quote}
            placeholder="Describe the outcome you achieved and what made the difference."
            onChange={(event) => setQuote(event.target.value)}
            aria-invalid={errors.quote ? true : undefined}
          />
          <FieldDescription>
            {quote.trim().length}/600 characters. Minimum 20.
          </FieldDescription>
          <FieldError>{errors.quote}</FieldError>
        </Field>

        <Field
          data-invalid={errors.consentToPublish ? true : undefined}
          className="rounded-lg border border-border p-3"
        >
          <label className="flex items-start gap-2.5 text-sm">
            <Checkbox
              checked={consentToPublish}
              onCheckedChange={(checked) => setConsentToPublish(checked === true)}
              aria-invalid={errors.consentToPublish ? true : undefined}
            />
            <span>
              <span className="font-medium text-foreground">
                I consent to this testimonial being published
              </span>
              <span className="mt-1 block text-muted-foreground">
                Publication is not automatic. A platform administrator reviews the
                submission first, and you can withdraw consent at any time.
              </span>
            </span>
          </label>
          <FieldError>{errors.consentToPublish}</FieldError>
        </Field>

        <Field className="rounded-lg border border-border p-3">
          <FieldLabel>Identifying information to show publicly</FieldLabel>
          <FieldDescription>
            These choices only apply when the testimonial is published. Unchecked
            details are hidden from the public page.
          </FieldDescription>
          <div className="mt-1 grid gap-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={consentName}
                disabled={!consentToPublish}
                onCheckedChange={(checked) => setConsentName(checked === true)}
              />
              Show my display name
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={consentTitle}
                disabled={!consentToPublish}
                onCheckedChange={(checked) => setConsentTitle(checked === true)}
              />
              Show my role or title
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={consentCompany}
                disabled={!consentToPublish}
                onCheckedChange={(checked) => setConsentCompany(checked === true)}
              />
              Show my company name
            </label>
          </div>
        </Field>

        {errors.form ? <FieldError>{errors.form}</FieldError> : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
            Submit for review
          </Button>
          <p className="text-xs text-muted-foreground">
            Submitting does not publish the testimonial.
          </p>
        </div>
      </FieldGroup>
    </form>
  );
}
