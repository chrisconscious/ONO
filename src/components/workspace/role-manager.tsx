"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, PlusIcon, Settings2Icon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { humanise } from "@/lib/format";

export type RoleSummary = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  assignedCount: number;
  permissionCodes: string[];
};

export type PermissionItem = {
  code: string;
  module: string;
  resource: string;
  action: string;
  description: string;
};

function groupPermissions(permissions: PermissionItem[]) {
  const modules = new Map<string, PermissionItem[]>();
  for (const permission of permissions) {
    const list = modules.get(permission.module) ?? [];
    list.push(permission);
    modules.set(permission.module, list);
  }
  return [...modules.entries()].map(([module, items]) => ({
    module,
    items: items.sort(
      (a, b) =>
        a.resource.localeCompare(b.resource) || a.action.localeCompare(b.action),
    ),
  }));
}

/** Lists workspace roles and opens the create/edit permission editor. */
export function RoleManager({
  roles,
  permissions,
  canCreate,
  canUpdate,
}: {
  roles: RoleSummary[];
  permissions: PermissionItem[];
  canCreate: boolean;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [editor, setEditor] = useState<RoleSummary | "new" | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y divide-border">
        {roles.map((role) => (
          <li key={role.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">{role.name}</p>
                {role.isSystem ? (
                  <Badge variant="outline" className="gap-1">
                    <ShieldCheckIcon aria-hidden="true" />
                    System
                  </Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {role.description ?? "No description"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground tabular">
                {role.permissionCodes.length} permissions · {role.assignedCount}{" "}
                {role.assignedCount === 1 ? "member" : "members"}
              </p>
            </div>
            {canUpdate && !role.isSystem ? (
              <Button size="sm" variant="outline" onClick={() => setEditor(role)}>
                <Settings2Icon aria-hidden="true" />
                Edit role
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      {canCreate ? (
        <div className="border-t border-border px-4 py-3">
          <Button size="sm" onClick={() => setEditor("new")}>
            <PlusIcon aria-hidden="true" />
            Create custom role
          </Button>
        </div>
      ) : null}

      {editor ? (
        <RoleDialog
          role={editor === "new" ? null : editor}
          permissions={permissions}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function RoleDialog({
  role,
  permissions,
  onClose,
  onSaved,
}: {
  role: RoleSummary | null;
  permissions: PermissionItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const isEditing = role !== null;
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selected, setSelected] = useState<string[]>(role?.permissionCodes ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const groups = useMemo(() => groupPermissions(permissions), [permissions]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggle(code: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? [...new Set([...current, code])]
        : current.filter((item) => item !== code),
    );
  }

  function toggleModule(items: PermissionItem[], checked: boolean) {
    const codes = items.map((item) => item.code);
    setSelected((current) =>
      checked
        ? [...new Set([...current, ...codes])]
        : current.filter((code) => !codes.includes(code)),
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Role name must be at least two characters.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        isEditing ? `/api/workspace/roles/${role.id}` : "/api/workspace/roles",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
            permissionCodes: selected,
          }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "The role could not be saved.");
        return;
      }

      toast.success(isEditing ? "Role updated." : "Role created.");
      router.refresh();
      onSaved();
    } catch {
      setError("We could not reach the server. Check your connection and retry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit ${role.name}` : "Create custom role"}</DialogTitle>
          <DialogDescription>
            Choose the actions this role can perform. A member can hold several roles; their
            permissions are combined.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="role-name">
                  Role name
                  <span className="text-destructive" aria-hidden="true">
                    {" "}
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="role-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="For example: Finance reviewer"
                  maxLength={80}
                  disabled={saving}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="role-description">Description</FieldLabel>
                <Textarea
                  id="role-description"
                  rows={1}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What is this role responsible for?"
                  maxLength={240}
                  disabled={saving}
                />
                <FieldDescription>Optional, shown in the role list.</FieldDescription>
              </Field>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">Permissions</h3>
                <span className="text-xs text-muted-foreground tabular">
                  {selected.length} selected
                </span>
              </div>

              <div className="mt-2 flex flex-col gap-3">
                {groups.map((group) => {
                  const allSelected = group.items.every((item) =>
                    selectedSet.has(item.code),
                  );
                  return (
                    <fieldset
                      key={group.module}
                      className="rounded-lg border border-border px-3 py-2.5"
                    >
                      <legend className="flex items-center gap-3 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {group.module}
                        <button
                          type="button"
                          className="text-[0.65rem] font-medium tracking-normal text-primary normal-case underline-offset-2 hover:underline"
                          onClick={() => toggleModule(group.items, !allSelected)}
                          disabled={saving}
                        >
                          {allSelected ? "Clear module" : "Select module"}
                        </button>
                      </legend>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {group.items.map((permission) => (
                          <label
                            key={permission.code}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Checkbox
                              checked={selectedSet.has(permission.code)}
                              onCheckedChange={(checked) =>
                                toggle(permission.code, checked === true)
                              }
                              disabled={saving}
                            />
                            <span>
                              <span className="text-foreground">
                                {permission.description}
                              </span>
                              <span className="block text-[0.7rem] text-muted-foreground">
                                {humanise(permission.resource)} · {permission.code}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
              {saving ? "Saving…" : isEditing ? "Save role" : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
