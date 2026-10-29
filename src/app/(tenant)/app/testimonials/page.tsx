import type { Metadata } from "next";
import { MessageSquareQuoteIcon, ShieldCheckIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState, InlineAlert, SectionCard } from "@/components/app/states";
import { TestimonialSubmissionForm } from "@/components/workspace/testimonial-submission-form";
import {
  OwnTestimonials,
  type OwnTestimonial,
} from "@/components/workspace/own-testimonials";
import { can, requireWorkspace } from "@/lib/auth/guards";
import {
  getWorkspaceTenant,
} from "@/server/services/workspace/workspace.service";
import { listOwnTestimonials } from "@/server/services/testimonials/testimonials.service";

export const metadata: Metadata = {
  title: "Testimonials",
};

export const dynamic = "force-dynamic";

export default async function WorkspaceTestimonialsPage() {
  const { actor, membership } = await requireWorkspace("/app/testimonials");
  const canSubmit = can(membership, "PERM-TESTIMONIAL.SUBMIT");

  const [tenant, own] = await Promise.all([
    getWorkspaceTenant(membership.tenantId),
    canSubmit
      ? listOwnTestimonials({
          tenantId: membership.tenantId,
          userId: actor.id,
        })
      : Promise.resolve([]),
  ]);

  const testimonials: OwnTestimonial[] = own.map((item) => ({
    id: item.id,
    quote: item.quote,
    rating: item.rating,
    status: item.status,
    authorName: item.authorName,
    authorTitle: item.authorTitle,
    company: item.company,
    consentToPublish: item.consentToPublish,
    consentName: item.consentName,
    consentTitle: item.consentTitle,
    consentCompany: item.consentCompany,
    rejectionReason: item.rejectionReason,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    reviewedAt: item.reviewedAt?.toISOString() ?? null,
  }));

  const pending = testimonials.filter((item) => item.status === "PENDING").length;
  const published = testimonials.filter((item) => item.publishedAt).length;
  const needsAttention = testimonials.filter(
    (item) => item.status === "CHANGES_REQUESTED" || item.status === "REJECTED",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Testimonials"
        description={`Share your experience with ${tenant?.name ?? "your workspace"} and follow the moderation status of your own submissions.`}
        breadcrumbs={[{ label: "Workspace", href: "/app" }, { label: "Testimonials" }]}
      />

      {!canSubmit ? (
        <InlineAlert tone="warning" title="Submission is not available to your role">
          Your workspace role does not include testimonial submission. Ask a workspace
          administrator to grant the testimonial permission if you should be able to
          participate.
        </InlineAlert>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Pending review" value={pending} hint="With the platform team" />
            <StatCard label="Needs your attention" value={needsAttention} hint="Returned or rejected" />
            <StatCard label="Publicly visible" value={published} hint="Approved and published" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <SectionCard
              title="Submit a testimonial"
              description="Your company identity is taken from your active workspace membership. Submission does not publish the testimonial."
            >
              <TestimonialSubmissionForm
                defaultAuthorName={actor.name ?? actor.email}
                company={tenant?.name ?? ""}
              />
            </SectionCard>

            <SectionCard
              title="Your submissions"
              description="Only your own submissions are shown. Withdrawing consent removes a published testimonial immediately."
            >
              {testimonials.length === 0 ? (
                <EmptyState
                  icon={<MessageSquareQuoteIcon aria-hidden="true" />}
                  title="No submissions yet"
                  description="Your first testimonial will appear here with its moderation status."
                />
              ) : (
                <OwnTestimonials testimonials={testimonials} />
              )}
            </SectionCard>
          </div>

          <SectionCard title="How moderation works">
            <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <li className="flex gap-2">
                <span className="font-medium text-foreground">1. Submit</span>
                Your testimonial enters the pending queue. You can withdraw consent at
                any time.
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">2. Review</span>
                The platform team may approve, reject with a reason, or request changes.
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">3. Publish</span>
                Approved testimonials can be published with only the identity details
                you consented to show.
              </li>
            </ul>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheckIcon className="size-3.5" aria-hidden="true" />
              You cannot approve or publish your own testimonial. The platform backend
              enforces the workflow.
            </p>
          </SectionCard>
        </>
      )}
    </div>
  );
}
