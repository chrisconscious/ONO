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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { humanise } from "@/lib/format";

type OpportunityStageDialogProps = {
  opportunityId: string;
  currentStage: string;
  disabled?: boolean;
  triggerLabel?: string;
  triggerSize?: "xs" | "sm" | "default";
};

const stageOptions = [
  "PROSPECTING",
  "QUALIFICATION",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;

/**
 * Moves an opportunity stage with explicit close reasons.
 *
 * The server records the transition, recalculates the baseline and dispatches
 * matching automations. The dialog never reopens a closed deal.
 */
export function OpportunityStageDialog({
  opportunityId,
  currentStage,
  disabled = false,
  triggerLabel = "Move stage",
  triggerSize = "xs",
}: OpportunityStageDialogProps) {
  const router = useRouter();
  const closed = currentStage === "CLOSED_WON" || currentStage === "CLOSED_LOST";
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [lostReason, setLostReason] = useState("");
  const [wonReason, setWonReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stage) {
      setError("Choose the next stage.");
      return;
    }
    if (stage === "CLOSED_LOST" && !lostReason.trim()) {
      setError("A lost reason is required when closing a deal as lost.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/tenant/crm/opportunities/${opportunityId}/stage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage,
            lostReason: lostReason.trim() || undefined,
            wonReason: wonReason.trim() || undefined,
          }),
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "The stage could not be changed.");
        return;
      }

      toast.success(`Stage moved to ${humanise(stage)}.`);
      setOpen(false);
      setStage("");
      setLostReason("");
      setWonReason("");
      router.refresh();
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size={triggerSize}
            disabled={disabled || closed}
          />
        }
      >
        <ArrowRightIcon aria-hidden="true" />
        {closed ? "Closed" : triggerLabel}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move opportunity stage</DialogTitle>
          <DialogDescription>
            Current stage: {humanise(currentStage)}. Closed deals cannot be
            reopened here because the stage history is immutable.
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
              <FieldLabel htmlFor="stage-next">Next stage</FieldLabel>
              <Select
                value={stage}
                onValueChange={(next) => setStage(next ?? "")}
              >
                <SelectTrigger
                  id="stage-next"
                  className="w-full"
                  aria-label="Next stage"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stageOptions
                    .filter((option) => option !== currentStage)
                    .map((option) => (
                      <SelectItem key={option} value={option}>
                        {humanise(option)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>

            {stage === "CLOSED_WON" ? (
              <Field>
                <FieldLabel htmlFor="stage-won">
                  Won reason (optional)
                </FieldLabel>
                <Input
                  id="stage-won"
                  value={wonReason}
                  maxLength={500}
                  placeholder="What secured the deal?"
                  onChange={(event) => setWonReason(event.target.value)}
                  disabled={saving}
                />
              </Field>
            ) : null}

            {stage === "CLOSED_LOST" ? (
              <Field>
                <FieldLabel htmlFor="stage-lost">Lost reason</FieldLabel>
                <Textarea
                  id="stage-lost"
                  rows={2}
                  value={lostReason}
                  maxLength={500}
                  placeholder="Why was the deal lost?"
                  onChange={(event) => setLostReason(event.target.value)}
                  disabled={saving}
                />
                <FieldDescription>
                  Lost reasons feed the lost-reason analysis on the insights page.
                </FieldDescription>
              </Field>
            ) : null}
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
            <Button type="submit" disabled={saving || !stage}>
              {saving ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : null}
              {saving ? "Saving" : "Confirm stage"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
