import type { Metadata } from "next";
import { MessageSquareQuoteIcon, StarIcon } from "lucide-react";
import { TestimonialStatus } from "@prisma/client";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { Pagination } from "@/components/app/data-table";
import {
  ClearFilters,
  DateRangeFilter,
  FilterSelect,
  SearchInput,
} from "@/components/app/filters";
import {
  TestimonialModerationPanel,
  type ModerationTestimonial,
} from "@/components/platform/testimonial-moderation-panel";
import { TestimonialDisplayOrder } from "@/components/platform/testimonial-display-order";
import {
  countPublishedTestimonials,
  countTestimonialsByStatus,
  listPublishedForOrdering,
  listTestimonialTenants,
  listTestimonialsForModeration,
} from "@/server/services/testimonials/testimonials.service";
import { formatDate, pluralise } from "@/lib/format";

export const metadata: Metadata = {
  title: "Testimonials",
};

export const dynamic = "force-dynamic";

const statusOptions = [
  { value: TestimonialStatus.PENDING, label: "Pending" },
  { value: TestimonialStatus.CHANGES_REQUESTED, label: "Changes requested" },
  { value: TestimonialStatus.APPROVED, label: "Approved" },
  { value: TestimonialStatus.REJECTED, label: "Rejected" },
  { value: TestimonialStatus.ARCHIVED, label: "Archived" },
];

const ratingOptions = [5, 4, 3, 2, 1].map((value) => ({
  value: String(value),
  label: `${value} ${value === 1 ? "star" : "stars"}`,
}));

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value: string | undefined) {
  return value && Object.values(TestimonialStatus).includes(value as TestimonialStatus)
    ? (value as TestimonialStatus)
    : undefined;
}

function parseDate(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(single(params.page)) || 1);
  const pageSize = 20;

  const status = parseStatus(single(params.status));
  const tenantId = single(params.tenantId) || undefined;
  const ratingValue = Number(single(params.rating));
  const rating =
    Number.isInteger(ratingValue) && ratingValue >= 1 && ratingValue <= 5
      ? ratingValue
      : undefined;
  const from = parseDate(single(params.from));
  const to = parseDate(single(params.to));
  const q = single(params.q)?.trim() || undefined;

  const [result, counts, published, tenants, publishedForOrder] = await Promise.all([
    listTestimonialsForModeration({
      status,
      tenantId,
      rating,
      from,
      to,
      q,
      page,
      pageSize,
    }),
    countTestimonialsByStatus(),
    countPublishedTestimonials(),
    listTestimonialTenants(),
    listPublishedForOrdering(),
  ]);

  const testimonials: ModerationTestimonial[] = result.testimonials.map((item) => ({
    id: item.id,
    authorName: item.authorName,
    authorTitle: item.authorTitle,
    company: item.company,
    quote: item.quote,
    rating: item.rating,
    status: item.status,
    consentToPublish: item.consentToPublish,
    consentName: item.consentName,
    consentTitle: item.consentTitle,
    consentCompany: item.consentCompany,
    rejectionReason: item.rejectionReason,
    moderationNotes: item.moderationNotes,
    isFeatured: item.isFeatured,
    displayOrder: item.displayOrder,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    archivedAt: item.archivedAt?.toISOString() ?? null,
    reviewedAt: item.reviewedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    tenant: item.tenant,
    submittedBy: item.submittedBy,
  }));

  const hasFilters = Boolean(status || tenantId || rating || from || to || q);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Testimonial moderation"
        description="Review submissions from tenant workspaces. Approval and publication are separate decisions; only published, consented testimonials appear publicly."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending review"
          value={counts.PENDING ?? 0}
          hint="Awaiting a platform decision"
        />
        <StatCard
          label="Changes requested"
          value={counts.CHANGES_REQUESTED ?? 0}
          hint="Returned to the author"
        />
        <StatCard
          label="Approved"
          value={counts.APPROVED ?? 0}
          hint="Eligible for publication"
        />
        <StatCard
          label="Publicly visible"
          value={published}
          hint="Published with consent"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-xs">
        <SearchInput placeholder="Search quote, author or company…" />
        <FilterSelect
          param="status"
          label="Filter by status"
          options={statusOptions}
          allLabel="All statuses"
        />
        <FilterSelect
          param="tenantId"
          label="Filter by company"
          options={tenants.map((tenant) => ({
            value: tenant.id,
            label: tenant.name,
          }))}
          allLabel="All companies"
        />
        <FilterSelect
          param="rating"
          label="Filter by rating"
          options={ratingOptions}
          allLabel="All ratings"
        />
        <DateRangeFilter />
        {hasFilters ? <ClearFilters /> : null}
      </div>

      {testimonials.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-xs">
          <EmptyState
            icon={<MessageSquareQuoteIcon aria-hidden="true" />}
            title={hasFilters ? "No testimonials match these filters" : "No testimonials yet"}
            description={
              hasFilters
                ? "Adjust or clear the filters to see the rest of the moderation queue."
                : "Tenant members submit testimonials from their workspace testimonials page. Submissions appear here for review."
            }
            action={hasFilters ? <ClearFilters /> : undefined}
          />
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {testimonials.map((testimonial) => (
            <li
              key={testimonial.id}
              className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Stars value={testimonial.rating} />
                  {testimonial.isFeatured ? (
                    <span className="text-[0.7rem] font-medium text-primary">Featured</span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={testimonial.status} />
                  {testimonial.publishedAt ? (
                    <StatusBadge status="PUBLISHED" label="Published" />
                  ) : null}
                  {!testimonial.consentToPublish ? (
                    <StatusBadge status="PENDING" label="No consent" tone="danger" />
                  ) : null}
                </div>
              </div>

              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                “{testimonial.quote}”
              </blockquote>

              <div className="mt-4 border-t border-border pt-3">
                <p className="text-sm font-medium text-foreground">
                  {testimonial.authorName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[testimonial.authorTitle, testimonial.company]
                    .filter(Boolean)
                    .join(" · ") || "No title provided"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {testimonial.tenant ? testimonial.tenant.name : "Platform submission"} ·
                  submitted {formatDate(testimonial.createdAt)}
                  {testimonial.publishedAt
                    ? ` · published ${formatDate(testimonial.publishedAt)}`
                    : ""}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <TestimonialModerationPanel testimonial={testimonial} />
                <span className="text-[0.7rem] text-muted-foreground tabular">
                  Order {testimonial.displayOrder}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={result.total}
          basePath="/admin/testimonials"
          params={{
            status: single(params.status),
            tenantId,
            rating: rating ? String(rating) : undefined,
            from: single(params.from),
            to: single(params.to),
            q,
          }}
          itemLabel="testimonial"
        />
      </div>

      {publishedForOrder.length > 1 ? (
        <section className="rounded-xl border border-border bg-card shadow-xs">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Public display order
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Only approved, published and consented testimonials appear here.
            </p>
          </div>
          <div className="p-4">
            <TestimonialDisplayOrder
              key={publishedForOrder.map((item) => item.id).join(":")}
              items={publishedForOrder}
            />
          </div>
        </section>
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Showing {testimonials.length} of {result.total}{" "}
        {pluralise(result.total, "testimonial")} matching this view. Rejection and
        change requests record a reason the author can see; archives are retained
        for the moderation record.
      </p>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`Rated ${clamped} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          aria-hidden="true"
          className={
            index < clamped
              ? "size-3.5 fill-warning text-warning"
              : "size-3.5 text-border"
          }
        />
      ))}
    </span>
  );
}
