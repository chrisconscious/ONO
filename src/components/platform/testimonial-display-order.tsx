"use client";

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type DisplayOrderItem = {
  id: string;
  authorName: string;
  company: string | null;
  isFeatured: boolean;
};

/**
 * Persists the public testimonial order through the moderation reorder
 * endpoint. Featured testimonials are pinned above unfeatured ones by the
 * public query, so moves across that boundary are disabled rather than shown
 * as no-ops.
 */
export function TestimonialDisplayOrder({ items }: { items: DisplayOrderItem[] }) {
  const [order, setOrder] = useState(items);
  const [pending, setPending] = useState<{ id: string; direction: -1 | 1 } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    if (order[index].isFeatured !== order[target].isFeatured) return;
    if (pending) return;

    const previous = order;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];

    setOrder(next);
    setPending({ id: order[index].id, direction });
    setError(null);

    try {
      const response = await fetch("/api/admin/testimonials/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((item) => item.id) }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setOrder(previous);
        setError(data.error ?? "The display order could not be saved.");
        return;
      }

      toast.success("Public display order updated.");
    } catch {
      setOrder(previous);
      setError("We could not reach the server. Check your connection and retry.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Featured testimonials remain above unfeatured ones. The arrows reorder
        published items within each group and apply to the public carousel
        immediately.
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <ol className="divide-y divide-border rounded-lg border border-border">
        {order.map((item, index) => {
          const previous = order[index - 1];
          const next = order[index + 1];
          const canMoveUp =
            index > 0 && previous.isFeatured === item.isFeatured;
          const canMoveDown =
            index < order.length - 1 && next.isFeatured === item.isFeatured;
          const saving = pending?.id === item.id;

          return (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 px-3 py-2.5"
            >
              <span className="w-6 text-xs text-muted-foreground tabular">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{item.authorName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.company ?? "No company shown"}
                </p>
              </div>
              {item.isFeatured ? (
                <Badge variant="outline" className="text-[0.7rem]">
                  Featured
                </Badge>
              ) : null}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={`Move ${item.authorName} earlier`}
                  title={
                    canMoveUp
                      ? "Move earlier"
                      : "Already first in its group"
                  }
                  disabled={!canMoveUp || pending !== null}
                  onClick={() => void move(index, -1)}
                >
                  {saving && pending?.direction === -1 ? (
                    <Loader2Icon className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowUpIcon aria-hidden="true" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={`Move ${item.authorName} later`}
                  title={
                    canMoveDown
                      ? "Move later"
                      : "Already last in its group"
                  }
                  disabled={!canMoveDown || pending !== null}
                  onClick={() => void move(index, 1)}
                >
                  {saving && pending?.direction === 1 ? (
                    <Loader2Icon className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowDownIcon aria-hidden="true" />
                  )}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
