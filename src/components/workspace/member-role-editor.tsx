"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, UserCogIcon } from "lucide-react";
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

export type AssignableRole = {
  id: string;
  name: string;
  isSystem: boolean;
};

/**
 * Assigns roles to one workspace member.
 *
 * The server re-checks the membership, the tenant and the caller's own
 * membership, so the disabled self-edit state here is a convenience only.
 */
export function MemberRoleEditor({
  membershipId,
  memberName,
  roleIds,
  roles,
  canEdit,
  isSelf,
}: {
  membershipId: string;
  memberName: string;
  roleIds: string[];
  roles: AssignableRole[];
  canEdit: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(roleIds);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!canEdit) return null;

  function toggle(roleId: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? [...new Set([...current, roleId])]
        : current.filter((item) => item !== roleId),
    );
  }

  function openDialog() {
    setSelected(roleIds);
    setError(null);
    setOpen(true);
  }

  async function save() {
    setError(null);

    if (selected.length === 0) {
      setError("Assign at least one role so the member keeps access.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/workspace/members/${membershipId}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleIds: selected }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "The member roles could not be updated.");
        return;
      }

      toast.success(`Roles updated for ${memberName}.`);
      setOpen(false);
      router.refresh();
    } catch {
      setError("We could not reach the server. Check your connection and retry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={openDialog}
        disabled={isSelf}
        title={
          isSelf
            ? "You cannot change your own roles. Ask another workspace administrator."
            : undefined
        }
      >
        <UserCogIcon aria-hidden="true" />
        Assign roles
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && !saving) setOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign roles to {memberName}</DialogTitle>
            <DialogDescription>
              Permissions from every assigned role are combined. Changes apply the next
              time the member loads the workspace.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            {roles.map((role) => (
              <label
                key={role.id}
                className="flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <Checkbox
                  checked={selected.includes(role.id)}
                  onCheckedChange={(checked) => toggle(role.id, checked === true)}
                  disabled={saving}
                />
                <span>
                  <span className="text-foreground">{role.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {role.isSystem ? "System role" : "Custom role"}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
              {saving ? "Saving…" : "Save roles"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
