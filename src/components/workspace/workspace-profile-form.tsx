"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** Edits the workspace fields the backend allows a tenant to change. */
export function WorkspaceProfileForm({
  industry,
  canEdit,
}: {
  industry: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(industry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await fetch("/api/workspace/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: value.trim() }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "The workspace profile could not be saved.");
        return;
      }

      toast.success("Workspace industry updated.");
      router.refresh();
    } catch {
      setError("We could not reach the server. Check your connection and retry.");
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    return (
      <div>
        <p className="text-xs text-muted-foreground">Industry</p>
        <p className="mt-0.5 text-foreground">{industry || "Not set"}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Your role cannot change workspace settings. Ask an administrator with industry
          configuration access.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="workspace-industry">Industry</FieldLabel>
        <div className="flex flex-wrap items-start gap-2">
          <Input
            id="workspace-industry"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="For example: Wholesale and distribution"
            maxLength={120}
            disabled={saving}
            className="max-w-sm"
          />
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : (
              <PencilIcon aria-hidden="true" />
            )}
            {saving ? "Saving…" : "Save industry"}
          </Button>
        </div>
        <FieldDescription>
          Used to tailor terminology and reporting hints. The organisation name and slug
          remain managed by platform administration.
        </FieldDescription>
        <FieldError>{error}</FieldError>
      </Field>
    </form>
  );
}
