"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type LeadConvertDialogProps = {
  leadId: string;
  defaultOpportunityName: string;
  defaultAmount?: string;
  disabled?: boolean;
};

/**
 * Confirms a lead conversion.
 *
 * Converting creates an account, a contact and an opportunity in one audited
 * server transaction. It never sends a message or invents missing data.
 */
export function LeadConvertDialog({
  leadId,
  defaultOpportunityName,
  defaultAmount,
  disabled = false,
}: LeadConvertDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [opportunityName, setOpportunityName] = useState(
    defaultOpportunityName,
  );
  const [amount, setAmount] = useState(defaultAmount ?? "");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenant/crm/leads/${leadId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityName: opportunityName.trim() || undefined,
          amount: amount === "" ? undefined : Number(amount),
          expectedCloseDate: expectedCloseDate || undefined,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        opportunityId?: string;
        error?: string;
      };

      if (!response.ok || !data.opportunityId) {
        setError(data.error ?? "The lead could not be converted.");
        return;
      }

      toast.success("Lead converted. Account, contact and deal created.");
      setOpen(false);
      router.push(`/app/opportunities/${data.opportunityId}`);
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" disabled={disabled} />}>
        <ArrowRightIcon aria-hidden="true" />
        Convert lead
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert this lead</DialogTitle>
          <DialogDescription>
            This creates an account, a contact and an opportunity. The action is
            recorded in the audit trail and cannot be undone from this screen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          ) : null}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="convert-name">Opportunity name</FieldLabel>
              <Input
                id="convert-name"
                value={opportunityName}
                maxLength={200}
                onChange={(event) => setOpportunityName(event.target.value)}
                disabled={saving}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="convert-amount">Deal value (optional)</FieldLabel>
              <Input
                id="convert-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={saving}
              />
              <FieldDescription>
                Uses the lead currency. No value is invented if you leave this
                empty.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="convert-close">
                Expected close date (optional)
              </FieldLabel>
              <Input
                id="convert-close"
                type="date"
                value={expectedCloseDate}
                onChange={(event) => setExpectedCloseDate(event.target.value)}
                disabled={saving}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : null}
              {saving ? "Converting" : "Convert lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
