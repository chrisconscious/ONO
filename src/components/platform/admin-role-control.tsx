"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roles = [
  { value: "PLATFORM_ADMIN", label: "Platform administrator" },
  { value: "TENANT_ADMIN", label: "Tenant administrator" },
  { value: "MEMBER", label: "Member" },
];

/**
 * Changes an account's platform-level role through the protected admin API.
 * The server rejects demoting the final platform administrator.
 */
export function AdminRoleControl({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(role);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  async function update(next: string | null) {
    if (!next || next === current) return;

    const previous = current;
    setCurrent(next);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setCurrent(previous);
        toast.error(data.error ?? "Could not update the role.");
        return;
      }

      toast.success("Role updated.");
      startTransition(() => router.refresh());
    } catch {
      setCurrent(previous);
      toast.error("We could not reach the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={current} onValueChange={(next) => void update(next)} disabled={disabled || isSaving}>
        <SelectTrigger size="sm" aria-label="Account role" className="min-w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {roles.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isSaving || isPending ? (
        <Loader2Icon
          className="size-3.5 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
