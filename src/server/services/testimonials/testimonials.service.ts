import { Prisma, TestimonialStatus } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import {
  toPublicTestimonial,
  type PublicTestimonial,
} from "@/lib/testimonials/public";

export type { PublicTestimonial } from "@/lib/testimonials/public";

const publicSelect = {
  quote: true,
  authorName: true,
  authorTitle: true,
  company: true,
  rating: true,
  consentName: true,
  consentTitle: true,
  consentCompany: true,
} satisfies Prisma.TestimonialSelect;

/**
 * Returns testimonials that the platform has approved, published and for which
 * the author granted publication consent. Identifying fields are hidden when
 * the author did not consent to them.
 */
export async function listPublishedTestimonials(
  limit = 8,
): Promise<PublicTestimonial[]> {
  const rows = await prisma.testimonial.findMany({
    where: {
      status: TestimonialStatus.APPROVED,
      publishedAt: { not: null },
      consentToPublish: true,
    },
    orderBy: [
      { isFeatured: "desc" },
      { displayOrder: "asc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
    select: publicSelect,
  });

  return rows.map((row) => toPublicTestimonial(row));
}

export type ModerationFilters = {
  status?: TestimonialStatus;
  tenantId?: string;
  rating?: number;
  from?: Date;
  to?: Date;
  q?: string;
  page: number;
  pageSize: number;
};

export async function listTestimonialsForModeration(filters: ModerationFilters) {
  const where: Prisma.TestimonialWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.rating) where.rating = filters.rating;
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }
  if (filters.q) {
    where.OR = [
      { quote: { contains: filters.q, mode: "insensitive" } },
      { authorName: { contains: filters.q, mode: "insensitive" } },
      { company: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const [testimonials, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: [
        { status: "asc" },
        { isFeatured: "desc" },
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.testimonial.count({ where }),
  ]);

  return { testimonials, total };
}

export async function countTestimonialsByStatus() {
  const groups = await prisma.testimonial.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return groups.reduce<Record<string, number>>((accumulator, group) => {
    accumulator[group.status] = group._count._all;
    return accumulator;
  }, {});
}

/** Count of approved testimonials currently visible on the public page. */
export async function countPublishedTestimonials() {
  return prisma.testimonial.count({
    where: {
      status: TestimonialStatus.APPROVED,
      publishedAt: { not: null },
      consentToPublish: true,
    },
  });
}

/**
 * Published testimonials in the order the public surface renders them. The
 * moderation screen uses this list to persist a new display order.
 */
export async function listPublishedForOrdering() {
  return prisma.testimonial.findMany({
    where: {
      status: TestimonialStatus.APPROVED,
      publishedAt: { not: null },
      consentToPublish: true,
    },
    orderBy: [
      { isFeatured: "desc" },
      { displayOrder: "asc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      authorName: true,
      company: true,
      isFeatured: true,
      displayOrder: true,
    },
  });
}

/** Tenants that have at least one testimonial, used by the moderation filter. */
export async function listTestimonialTenants() {
  return prisma.tenant.findMany({
    where: { testimonials: { some: {} } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getTestimonialForModeration(id: string) {
  const [testimonial, history] = await Promise.all([
    prisma.testimonial.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { resource: "testimonial", resourceId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        action: true,
        createdAt: true,
        metadata: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return testimonial ? { testimonial, history } : null;
}

export type ModerationAction =
  | "approve"
  | "reject"
  | "request_changes"
  | "publish"
  | "unpublish"
  | "feature"
  | "unfeature"
  | "archive"
  | "edit";

export type ModerationResult =
  | { ok: true; testimonial: Awaited<ReturnType<typeof prisma.testimonial.update>> }
  | { ok: false; message: string };

/**
 * Applies one moderation transition. Approval and publication are combined by
 * the established workflow, but publication can be withdrawn independently.
 * Every guard is re-checked here; the UI never decides validity.
 */
export async function applyModerationAction(params: {
  id: string;
  action: ModerationAction;
  reviewerId: string;
  note?: string;
  edits?: {
    authorName?: string;
    authorTitle?: string | null;
    company?: string | null;
    quote?: string;
    rating?: number;
    displayOrder?: number;
  };
}): Promise<ModerationResult> {
  const existing = await prisma.testimonial.findUnique({ where: { id: params.id } });
  if (!existing) return { ok: false, message: "Testimonial not found." };

  const now = new Date();
  const base = {
    reviewedById: params.reviewerId,
    reviewedAt: now,
  };

  switch (params.action) {
    case "approve": {
      if (existing.status === TestimonialStatus.ARCHIVED) {
        return { ok: false, message: "Restore the testimonial before approving it." };
      }
      if (!existing.consentToPublish) {
        return { ok: false, message: "The author has not consented to publication." };
      }
      return {
        ok: true,
        testimonial: await prisma.testimonial.update({
          where: { id: params.id },
          data: {
            ...base,
            status: TestimonialStatus.APPROVED,
            rejectionReason: null,
            archivedAt: null,
            publishedAt: now,
          },
        }),
      };
    }

    case "reject": {
      if (!params.note?.trim()) {
        return { ok: false, message: "Record a reason for the rejection." };
      }
      return {
        ok: true,
        testimonial: await prisma.testimonial.update({
          where: { id: params.id },
          data: {
            ...base,
            status: TestimonialStatus.REJECTED,
            rejectionReason: params.note.trim(),
            publishedAt: null,
          },
        }),
      };
    }

    case "request_changes": {
      if (!params.note?.trim()) {
        return { ok: false, message: "Describe the changes required." };
      }
      return {
        ok: true,
        testimonial: await prisma.testimonial.update({
          where: { id: params.id },
          data: {
            ...base,
            status: TestimonialStatus.CHANGES_REQUESTED,
            rejectionReason: params.note.trim(),
            publishedAt: null,
          },
        }),
      };
    }

    case "publish": {
      if (existing.status !== TestimonialStatus.APPROVED) {
        return { ok: false, message: "Only approved testimonials can be published." };
      }
      if (!existing.consentToPublish) {
        return { ok: false, message: "The author has not consented to publication." };
      }
      return {
        ok: true,
        testimonial: await prisma.testimonial.update({
          where: { id: params.id },
          data: { publishedAt: now },
        }),
      };
    }

    case "unpublish":
      return {
        ok: true,
        testimonial: await prisma.testimonial.update({
          where: { id: params.id },
          data: { publishedAt: null },
        }),
      };

    case "feature":
      return {
        ok: true,
        testimonial: await prisma.testimonial.update({
          where: { id: params.id },
          data: { isFeatured: true },
        }),
      };

    case "unfeature":
      return {
        ok: true,
        testimonial: await prisma.testimonial.update({
          where: { id: params.id },
          data: { isFeatured: false },
        }),
      };

    case "archive":
      return {
        ok: true,
        testimonial: await prisma.testimonial.update({
          where: { id: params.id },
          data: {
            status: TestimonialStatus.ARCHIVED,
            publishedAt: null,
            archivedAt: now,
            ...base,
          },
        }),
      };

    case "edit": {
      const edits = params.edits;
      if (!edits) return { ok: false, message: "No changes were provided." };

      const nextQuote = edits.quote?.trim();
      if (nextQuote !== undefined && nextQuote.length < 20) {
        return { ok: false, message: "The testimonial must remain at least 20 characters." };
      }

      return {
        ok: true,
        testimonial: await prisma.testimonial.update({
          where: { id: params.id },
          data: {
            ...(edits.authorName !== undefined ? { authorName: edits.authorName.trim() } : {}),
            ...(edits.authorTitle !== undefined ? { authorTitle: edits.authorTitle } : {}),
            ...(edits.company !== undefined ? { company: edits.company } : {}),
            ...(nextQuote !== undefined ? { quote: nextQuote } : {}),
            ...(edits.rating !== undefined ? { rating: edits.rating } : {}),
            ...(edits.displayOrder !== undefined ? { displayOrder: edits.displayOrder } : {}),
          },
        }),
      };
    }

    default:
      return { ok: false, message: "Unsupported moderation action." };
  }
}

/** Applies a drag-free reorder by writing each item's position in one transaction. */
export async function reorderTestimonials(ids: string[]) {
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.testimonial.update({
        where: { id },
        data: { displayOrder: index },
      }),
    ),
  );
}

export async function createTestimonialSubmission(params: {
  tenantId: string;
  submittedById: string;
  authorName: string;
  authorTitle?: string | null;
  company: string;
  quote: string;
  rating: number;
  consentToPublish: boolean;
  consentName: boolean;
  consentTitle: boolean;
  consentCompany: boolean;
}) {
  return prisma.testimonial.create({
    data: {
      tenantId: params.tenantId,
      submittedById: params.submittedById,
      authorName: params.authorName,
      authorTitle: params.authorTitle ?? null,
      company: params.company,
      quote: params.quote,
      rating: params.rating,
      status: TestimonialStatus.PENDING,
      consentToPublish: params.consentToPublish,
      consentName: params.consentName,
      consentTitle: params.consentTitle,
      consentCompany: params.consentCompany,
    },
  });
}

export async function listOwnTestimonials(params: {
  tenantId: string;
  userId: string;
}) {
  const testimonials = await prisma.testimonial.findMany({
    where: { tenantId: params.tenantId, submittedById: params.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      quote: true,
      rating: true,
      status: true,
      authorName: true,
      authorTitle: true,
      company: true,
      consentToPublish: true,
      consentName: true,
      consentTitle: true,
      consentCompany: true,
      rejectionReason: true,
      publishedAt: true,
      createdAt: true,
      reviewedAt: true,
    },
  });

  return testimonials;
}

/** Withdraws publication consent for a submission owned by the caller. */
export async function withdrawTestimonialConsent(params: {
  id: string;
  tenantId: string;
  userId: string;
}) {
  const existing = await prisma.testimonial.findFirst({
    where: { id: params.id, tenantId: params.tenantId, submittedById: params.userId },
  });
  if (!existing) return null;

  return prisma.testimonial.update({
    where: { id: existing.id },
    data: {
      consentToPublish: false,
      publishedAt: null,
    },
  });
}

/** Lets an author revise a submission that a moderator returned. */
export async function reviseOwnTestimonial(params: {
  id: string;
  tenantId: string;
  userId: string;
  quote: string;
  rating: number;
  authorName: string;
  authorTitle: string | null;
  consentToPublish: boolean;
  consentName: boolean;
  consentTitle: boolean;
  consentCompany: boolean;
}) {
  const existing = await prisma.testimonial.findFirst({
    where: { id: params.id, tenantId: params.tenantId, submittedById: params.userId },
  });
  if (!existing) return { ok: false as const, message: "Testimonial not found." };
  if (
    existing.status !== TestimonialStatus.CHANGES_REQUESTED &&
    existing.status !== TestimonialStatus.REJECTED
  ) {
    return {
      ok: false as const,
      message: "Only a returned or rejected submission can be revised.",
    };
  }

  const testimonial = await prisma.testimonial.update({
    where: { id: existing.id },
    data: {
      quote: params.quote,
      rating: params.rating,
      authorName: params.authorName,
      authorTitle: params.authorTitle,
      consentToPublish: params.consentToPublish,
      consentName: params.consentName,
      consentTitle: params.consentTitle,
      consentCompany: params.consentCompany,
      status: TestimonialStatus.PENDING,
      rejectionReason: null,
      reviewedAt: null,
      reviewedById: null,
    },
  });

  return { ok: true as const, testimonial };
}
