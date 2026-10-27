-- Stage 18: public testimonials shown on the authentication page carousel.
-- Marketing records moderated by platform super admins; they are NOT tenant
-- business data, so this table intentionally has no tenantId column.
-- Fail-closed publication: isPublished defaults to false and only an
-- authorized approval action may flip it (enforced in testimonial-service).

CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "rating" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- Carousel query path: published rows ordered for display.
CREATE INDEX "testimonials_isPublished_displayOrder_idx" ON "testimonials"("isPublished", "displayOrder");

-- Approval audit trail FK: keep testimonial if the approver user is removed.
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
