"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, Loader2Icon, RotateCcwIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ReviewStatus = "APPROVED" | "REJECTED" | "PENDING";

/** Approves, rejects or re-opens a submitted testimonial. */
export function TestimonialReviewActions({
  testimonialId,
  status,
}: {
  testimonialId: string;
  status: ReviewStatus;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<ReviewStatus | null>(null);

  async function review(next: ReviewStatus) {
    setPendingAction(next);
    try {
      const response = await fetch(`/api/admin/testimonials/${testimonialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Could not update the testimonial.");
        return;
      }

      toast.success(
        next === "APPROVED"
          ? "Testimonial published on the sign-in screen."
          : next === "REJECTED"
            ? "Testimonial rejected."
            : "Testimonial returned to the review queue.",
      );
      router.refresh();
    } catch {
      toast.error("We could not reach the server. Please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "APPROVED" ? (
        <Button
          size="sm"
          onClick={() => void review("APPROVED")}
          disabled={pendingAction !== null}
        >
          {pendingAction === "APPROVED" ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <CheckIcon aria-hidden="true" />
          )}
          Approve
        </Button>
      ) : null}

      {status !== "REJECTED" ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => void review("REJECTED")}
          disabled={pendingAction !== null}
        >
          {pendingAction === "REJECTED" ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <XIcon aria-hidden="true" />
          )}
          Reject
        </Button>
      ) : null}

      {status !== "PENDING" ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void review("PENDING")}
          disabled={pendingAction !== null}
        >
          {pendingAction === "PENDING" ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcwIcon aria-hidden="true" />
          )}
          Re-open
        </Button>
      ) : null}
    </div>
  );
}
