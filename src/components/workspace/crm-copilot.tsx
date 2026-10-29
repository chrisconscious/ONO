"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircleIcon,
  CheckIcon,
  ClipboardCopyIcon,
  Loader2Icon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/app/states";
import { cn } from "@/lib/utils";
import { suggestionsFor } from "@/lib/crm/copilot";
import type { CopilotResult, CopilotScope } from "@/server/services/crm/copilot.service";

type CopilotPanelProps = {
  scope: CopilotScope;
  recordId?: string;
  /** Short label used in the panel heading, for example the record name. */
  contextLabel?: string;
  className?: string;
};

/**
 * Data-grounded CRM copilot.
 *
 * The panel posts to a read-only endpoint. It never executes a CRM action and
 * always renders the mode returned by the server so deterministic analysis is
 * never presented as a generative answer.
 */
export function CrmCopilotPanel({
  scope,
  recordId,
  contextLabel,
  className,
}: CopilotPanelProps) {
  const suggestions = suggestionsFor(scope);
  const [prompt, setPrompt] = useState(suggestions[0] ?? "");
  const [result, setResult] = useState<CopilotResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/tenant/crm/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          scope,
          recordId: recordId ?? undefined,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        result?: CopilotResult;
        error?: string;
      };

      if (!response.ok || !data.result) {
        setError(data.error ?? "The copilot could not answer that question.");
        return;
      }

      setResult(data.result);
    } catch {
      setError("We could not reach the copilot service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyDraft() {
    if (!result?.draft) return;
    try {
      await navigator.clipboard.writeText(result.draft);
      setCopied(true);
      toast.success("Draft copied. Nothing has been sent.");
    } catch {
      toast.error("The draft could not be copied in this browser.");
    }
  }

  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card shadow-xs",
        className,
      )}
      aria-labelledby="copilot-heading"
    >
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2
            id="copilot-heading"
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
          >
            <SparklesIcon className="size-4 text-primary" aria-hidden="true" />
            CRM copilot
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {contextLabel
              ? `Answers use this workspace and ${contextLabel}.`
              : "Answers use only records you are allowed to read in this workspace."}
          </p>
        </div>
        <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
          Read-only
        </span>
      </header>

      <div className="flex flex-col gap-3 p-4">
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void ask(prompt);
          }}
        >
          <label
            htmlFor="copilot-prompt"
            className="text-xs font-medium text-foreground"
          >
            Ask about your pipeline
          </label>
          <Textarea
            id="copilot-prompt"
            rows={2}
            value={prompt}
            maxLength={1200}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="For example: which deals are at risk?"
            disabled={loading}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[0.7rem] text-muted-foreground">
              No action is taken. Drafts are never sent.
            </p>
            <Button type="submit" size="sm" disabled={loading || !prompt.trim()}>
              {loading ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <SendIcon aria-hidden="true" />
              )}
              {loading ? "Analysing" : "Ask"}
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap gap-1.5">
          {suggestions.slice(0, 4).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={loading}
              onClick={() => {
                setPrompt(suggestion);
                void ask(suggestion);
              }}
              className="rounded-full border border-border bg-background px-2.5 py-1 text-left text-[0.7rem] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {error ? (
          <InlineAlert tone="error" title="Copilot unavailable">
            {error}
          </InlineAlert>
        ) : null}

        {loading && !result ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground"
          >
            <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
            Running workspace queries…
          </div>
        ) : null}

        {result ? (
          <div className="flex flex-col gap-3 border-t border-border pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[0.65rem] font-medium",
                  result.mode === "GENERATIVE"
                    ? "border-primary/25 bg-primary/10 text-primary"
                    : "border-info/25 bg-info/10 text-[color-mix(in_oklch,var(--info),var(--foreground)_38%)]",
                )}
              >
                {result.mode === "GENERATIVE"
                  ? "Generative response"
                  : "Deterministic analysis"}
              </span>
              <span className="text-[0.7rem] text-muted-foreground">
                {result.headline}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-foreground">
              {result.answer}
            </p>

            {result.bullets.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {result.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-2 text-sm leading-relaxed text-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60"
                    />
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}

            {result.evidence.length > 0 ? (
              <div>
                <p className="text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
                  Evidence
                </p>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {result.evidence.map((item) => (
                    <li
                      key={`${item.label}-${item.value}`}
                      className="flex flex-wrap items-baseline gap-x-1.5 text-xs"
                    >
                      <span className="text-muted-foreground">{item.label}:</span>
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {item.value}
                        </Link>
                      ) : (
                        <span className="text-foreground">{item.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.draft ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground">
                    Draft only — not sent
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => void copyDraft()}
                  >
                    {copied ? (
                      <CheckIcon aria-hidden="true" />
                    ) : (
                      <ClipboardCopyIcon aria-hidden="true" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap text-foreground">
                  {result.draft}
                </p>
              </div>
            ) : null}

            <details className="rounded-lg border border-border px-3 py-2">
              <summary className="cursor-pointer text-xs font-medium text-foreground">
                Method and limitations
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {result.modeLabel}
              </p>
              {result.limitations.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1">
                  {result.limitations.map((limitation) => (
                    <li
                      key={limitation}
                      className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground"
                    >
                      <AlertCircleIcon
                        className="mt-0.5 size-3 shrink-0"
                        aria-hidden="true"
                      />
                      {limitation}
                    </li>
                  ))}
                </ul>
              ) : null}
              {result.provider.configured ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Provider model: {result.provider.model ?? "configured"}
                </p>
              ) : null}
            </details>
          </div>
        ) : null}
      </div>
    </section>
  );
}
