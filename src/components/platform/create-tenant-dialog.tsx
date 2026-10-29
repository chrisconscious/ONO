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

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/**
 * Creates a tenant through the existing platform API. Slugs are normalised
 * client-side for convenience; the server still validates and enforces
 * uniqueness.
 */
export function CreateTenantDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    slug?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setName("");
    setSlug("");
    setSlugTouched(false);
    setIndustry("");
    setError(null);
    setFieldErrors({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const errors: typeof fieldErrors = {};
    if (name.trim().length < 2) {
      errors.name = "Enter the organisation name.";
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.slug = "Use lowercase letters, numbers and hyphens only.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug,
          industry: industry.trim() || undefined,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not create the tenant.");
        return;
      }

      toast.success(`${name.trim()} created.`);
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
        New tenant
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a tenant</DialogTitle>
          <DialogDescription>
            Provision a customer organisation. The tenant starts in the active
            state and can be suspended later.
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
            <Field data-invalid={Boolean(fieldErrors.name)}>
              <FieldLabel htmlFor="tenant-name">Organisation name</FieldLabel>
              <Input
                id="tenant-name"
                value={name}
                autoFocus
                placeholder="Acme Trading Ltd"
                aria-invalid={Boolean(fieldErrors.name)}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setName(nextName);
                  if (!slugTouched) setSlug(slugify(nextName));
                }}
                disabled={isSubmitting}
              />
              {fieldErrors.name ? (
                <FieldError>{fieldErrors.name}</FieldError>
              ) : null}
            </Field>

            <Field data-invalid={Boolean(fieldErrors.slug)}>
              <FieldLabel htmlFor="tenant-slug">Workspace slug</FieldLabel>
              <Input
                id="tenant-slug"
                value={slug}
                placeholder="acme-trading"
                aria-invalid={Boolean(fieldErrors.slug)}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(slugify(event.target.value));
                }}
                disabled={isSubmitting}
              />
              <FieldDescription>
                Used in workspace URLs. Lowercase letters, numbers and hyphens.
              </FieldDescription>
              {fieldErrors.slug ? (
                <FieldError>{fieldErrors.slug}</FieldError>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="tenant-industry">Industry (optional)</FieldLabel>
              <Input
                id="tenant-industry"
                value={industry}
                placeholder="Retail"
                onChange={(event) => setIndustry(event.target.value)}
                disabled={isSubmitting}
              />
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
              {isSubmitting ? "Creating…" : "Create tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
