"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, PlusIcon } from "lucide-react";
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

/** Captures a lead through the tenant-scoped leads API. */
export function CreateLeadDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    source: "",
    notes: "",
  });
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; email?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setValues({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyName: "",
      source: "",
      notes: "",
    });
    setErrors({});
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nextErrors: typeof errors = {};
    if (!values.firstName.trim()) nextErrors.firstName = "Enter a first name.";
    if (!values.lastName.trim()) nextErrors.lastName = "Enter a last name.";
    if (
      values.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
    ) {
      nextErrors.email = "Enter a valid email address, or leave it empty.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || undefined,
          companyName: values.companyName.trim() || undefined,
          source: values.source.trim() || undefined,
          notes: values.notes.trim() || undefined,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not save the lead.");
        return;
      }

      toast.success("Lead added.");
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button />}>
        <PlusIcon aria-hidden="true" />
        Add lead
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a lead</DialogTitle>
          <DialogDescription>
            Record an enquiry so the team can qualify and follow it up.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          ) : null}

          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.firstName)}>
                <FieldLabel htmlFor="lead-first">First name</FieldLabel>
                <Input
                  id="lead-first"
                  value={values.firstName}
                  autoFocus
                  autoComplete="off"
                  aria-invalid={Boolean(errors.firstName)}
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      firstName: event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                />
                {errors.firstName ? <FieldError>{errors.firstName}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(errors.lastName)}>
                <FieldLabel htmlFor="lead-last">Last name</FieldLabel>
                <Input
                  id="lead-last"
                  value={values.lastName}
                  autoComplete="off"
                  aria-invalid={Boolean(errors.lastName)}
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      lastName: event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                />
                {errors.lastName ? <FieldError>{errors.lastName}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(errors.email)}>
                <FieldLabel htmlFor="lead-email">Email</FieldLabel>
                <Input
                  id="lead-email"
                  type="email"
                  inputMode="email"
                  value={values.email}
                  placeholder="Optional"
                  aria-invalid={Boolean(errors.email)}
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                />
                {errors.email ? <FieldError>{errors.email}</FieldError> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="lead-phone">Phone</FieldLabel>
                <Input
                  id="lead-phone"
                  type="tel"
                  value={values.phone}
                  placeholder="Optional"
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      phone: event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="lead-company">Company</FieldLabel>
                <Input
                  id="lead-company"
                  value={values.companyName}
                  placeholder="Optional"
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      companyName: event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="lead-source">Source</FieldLabel>
                <Input
                  id="lead-source"
                  value={values.source}
                  placeholder="Referral, event, website…"
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      source: event.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="lead-notes">Notes</FieldLabel>
              <Textarea
                id="lead-notes"
                rows={3}
                value={values.notes}
                placeholder="Context for the follow-up"
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    notes: event.target.value,
                  }))
                }
                disabled={isSubmitting}
              />
              <FieldDescription>
                Notes are visible to members with lead access in this workspace.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : null}
              {isSubmitting ? "Saving…" : "Add lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
