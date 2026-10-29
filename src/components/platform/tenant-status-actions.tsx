"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
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

type TenantStatus =
  | "PROVISIONING"
  | "ACTIVE"
  | "SUSPENDED"
  | "CLOSING"
  | "CLOSED";

const transitions: Array<{
  status: TenantStatus;
  label: string;
  description: string;
  destructive?: boolean;
}> = [
  {
    status: "ACTIVE",
    label: "Activate",
    description: "Restore full access for every active member of this tenant.",
  },
  {
    status: "SUSPENDED",
    label: "Suspend",
    description:
      "Block workspace access immediately. Sessions remain valid but every workspace route is refused.",
    destructive: true,
  },
  {
    status: "CLOSING",
    label: "Mark closing",
    description: "Flag the tenant as winding down while remains readable.",
  },
  {
    status: "CLOSED",
    label: "Close tenant",
    description: "Mark the tenant closed. Data is retained for the audit trail.",
    destructive: true,
  },
];

/** Platform-side control for the tenant lifecycle. */
export function TenantStatusActions({
  tenantId,
  tenantName,
  currentStatus,
}: {
  tenantId: string;
  tenantName: string;
  currentStatus: TenantStatus;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<TenantStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const options = transitions.filter((item) => item.status !== currentStatus);
  const selected = transitions.find((item) => item.status === target);

  async function apply() {
    if (!target) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Could not update the tenant status.");
        return;
      }

      toast.success(`${tenantName} is now ${target.toLowerCase()}.`);
      setTarget(null);
      router.refresh();
    } catch {
      toast.error("We could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) setTarget(null);
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        Change status
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change tenant status</DialogTitle>
          <DialogDescription>
            {tenantName} is currently{" "}
            <span className="font-medium text-foreground">
              {currentStatus.toLowerCase()}
            </span>
            . Choose the next lifecycle state. The change is written to the
            audit log.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <button
              key={option.status}
              type="button"
              onClick={() => setTarget(option.status)}
              aria-pressed={target === option.status}
              className={
                target === option.status
                  ? "rounded-lg border border-primary/40 bg-primary/5 px-3 py-2.5 text-left"
                  : "rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
              }
            >
              <span className="block text-sm font-medium text-foreground">
                {option.label}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                {option.description}
              </span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setTarget(null)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={selected?.destructive ? "destructive" : "default"}
            onClick={() => void apply()}
            disabled={!target || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : null}
            {isSubmitting ? "Applying…" : "Apply status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
