"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, PlusIcon, WandSparklesIcon } from "lucide-react";
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

const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

function generatePassword(length = 16) {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]).join(
    "",
  );
}

/** Provisions an additional platform administrator account. */
export function CreateAdminDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setFieldErrors({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const errors: typeof fieldErrors = {};
    if (name.trim().length < 2) errors.name = "Enter the administrator's name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (password.length < 12) {
      errors.password = "Use at least 12 characters.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not create the administrator.");
        return;
      }

      toast.success("Platform administrator created.", {
        description: "Share the sign-in details through a secure channel.",
      });
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
        New administrator
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a platform administrator</DialogTitle>
          <DialogDescription>
            Platform administrators manage tenants, governance and platform
            configuration. They do not gain access to tenant business records.
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
              <FieldLabel htmlFor="admin-name">Full name</FieldLabel>
              <Input
                id="admin-name"
                value={name}
                autoFocus
                autoComplete="name"
                placeholder="Amina Hassan"
                aria-invalid={Boolean(fieldErrors.name)}
                onChange={(event) => setName(event.target.value)}
                disabled={isSubmitting}
              />
              {fieldErrors.name ? <FieldError>{fieldErrors.name}</FieldError> : null}
            </Field>

            <Field data-invalid={Boolean(fieldErrors.email)}>
              <FieldLabel htmlFor="admin-email">Email address</FieldLabel>
              <Input
                id="admin-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="admin@ono.example"
                value={email}
                aria-invalid={Boolean(fieldErrors.email)}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
              {fieldErrors.email ? (
                <FieldError>{fieldErrors.email}</FieldError>
              ) : null}
            </Field>

            <Field data-invalid={Boolean(fieldErrors.password)}>
              <FieldLabel htmlFor="admin-password">Temporary password</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="admin-password"
                  type="text"
                  value={password}
                  placeholder="At least 12 characters"
                  aria-invalid={Boolean(fieldErrors.password)}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPassword(generatePassword())}
                  disabled={isSubmitting}
                >
                  <WandSparklesIcon aria-hidden="true" />
                  Generate
                </Button>
              </div>
              <FieldDescription>
                The administrator should change this password after the first
                sign-in. It is never shown again.
              </FieldDescription>
              {fieldErrors.password ? (
                <FieldError>{fieldErrors.password}</FieldError>
              ) : null}
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
              {isSubmitting ? "Creating…" : "Create administrator"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
