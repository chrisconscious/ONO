"use client";

import { useState } from "react";
import {
  CalendarClockIcon,
  Loader2Icon,
  MailIcon,
  MessageSquareIcon,
  PhoneIcon,
  PlusIcon,
  StickyNoteIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { EmptyState } from "@/components/app/states";
import { formatDateTime, formatRelative, humanise } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TimelineEntry = {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  source: string;
  occurredAt: string | Date;
  user: { name: string | null; email: string } | null;
};

type RecordTimelineProps = {
  referenceType: "lead" | "contact" | "company" | "opportunity";
  referenceId: string;
  initialItems: TimelineEntry[];
  canWrite: boolean;
  currentUserName: string;
};

const activityTypes = ["NOTE", "CALL", "MEETING", "EMAIL"] as const;

const typeIcons = {
  NOTE: StickyNoteIcon,
  CALL: PhoneIcon,
  MEETING: CalendarClockIcon,
  EMAIL: MailIcon,
  TASK: CalendarClockIcon,
  STATUS_CHANGE: MessageSquareIcon,
  STAGE_CHANGE: MessageSquareIcon,
  CONVERSION: MessageSquareIcon,
  SYSTEM: MessageSquareIcon,
} as const;

function iconFor(type: string) {
  return typeIcons[type as keyof typeof typeIcons] ?? MessageSquareIcon;
}

/**
 * Record timeline with an inline interaction composer.
 *
 * New entries come straight from the API response, so the list stays accurate
 * without a full page reload. The API records the activity and updates the
 * record's last-contact timestamp on the server.
 */
export function RecordTimeline({
  referenceType,
  referenceId,
  initialItems,
  canWrite,
  currentUserName,
}: RecordTimelineProps) {
  const [items, setItems] = useState<TimelineEntry[]>(initialItems);
  const [type, setType] = useState<(typeof activityTypes)[number]>("NOTE");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedSubject = subject.trim();
    if (!trimmedSubject) {
      setError("Add a short subject for the interaction.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/tenant/crm/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceType,
          referenceId,
          type,
          subject: trimmedSubject,
          body: body.trim() || undefined,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        activity?: {
          id: string;
          type: string;
          subject: string;
          body: string | null;
          source: string;
          occurredAt: string;
        };
        error?: string;
      };

      if (!response.ok || !data.activity) {
        setError(data.error ?? "The activity could not be recorded.");
        return;
      }

      setItems((current) => [
        {
          ...data.activity!,
          user: { name: currentUserName, email: "" },
        },
        ...current,
      ]);
      setSubject("");
      setBody("");
      setType("NOTE");
      toast.success("Activity recorded.");
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canWrite ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-muted/30 p-3"
        >
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
              <Field>
                <FieldLabel htmlFor="activity-type">Interaction</FieldLabel>
                <Select
                  value={type}
                  onValueChange={(next) =>
                    setType((next as (typeof activityTypes)[number]) ?? "NOTE")
                  }
                >
                  <SelectTrigger
                    id="activity-type"
                    className="w-full"
                    aria-label="Interaction type"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((option) => (
                      <SelectItem key={option} value={option}>
                        {humanise(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="activity-subject">Subject</FieldLabel>
                <Input
                  id="activity-subject"
                  value={subject}
                  maxLength={200}
                  placeholder="What happened?"
                  onChange={(event) => setSubject(event.target.value)}
                  disabled={saving}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="activity-body">Details (optional)</FieldLabel>
              <Textarea
                id="activity-body"
                rows={2}
                value={body}
                maxLength={4000}
                placeholder="Notes for the team"
                onChange={(event) => setBody(event.target.value)}
                disabled={saving}
              />
            </Field>

            {error ? (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.7rem] text-muted-foreground">
                Recorded in this workspace. No email or message is sent.
              </p>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? (
                  <Loader2Icon className="animate-spin" aria-hidden="true" />
                ) : (
                  <PlusIcon aria-hidden="true" />
                )}
                {saving ? "Saving" : "Log activity"}
              </Button>
            </div>
          </div>
        </form>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          icon={<MessageSquareIcon aria-hidden="true" />}
          title="No activity recorded yet"
          description="Log a call, email, meeting or note to start the timeline."
        />
      ) : (
        <ol className="flex flex-col">
          {items.map((item, index) => {
            const Icon = iconFor(item.type);
            return (
              <li
                key={item.id}
                className={cn(
                  "relative flex gap-3 pb-4",
                  index === items.length - 1 && "pb-0",
                )}
              >
                <div className="flex flex-col items-center">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  {index < items.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="mt-1 w-px flex-1 bg-border"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {item.subject}
                    </p>
                    <time
                      dateTime={new Date(item.occurredAt).toISOString()}
                      title={formatDateTime(item.occurredAt)}
                      className="text-[0.7rem] whitespace-nowrap text-muted-foreground"
                    >
                      {formatRelative(item.occurredAt)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                    {humanise(item.type)}
                    {item.user?.name ? ` · ${item.user.name}` : ""}
                    {item.source === "AUTOMATION"
                      ? " · automation"
                      : item.source === "SYSTEM"
                        ? " · system"
                        : ""}
                  </p>
                  {item.body ? (
                    <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {item.body}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
