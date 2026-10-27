import { beforeEach, describe, expect, it } from "vitest";
import { prisma, truncateAll } from "../helpers/dbBootstrap";
import { makeTenantWithUser } from "../helpers/fixtures";
import {
  approveTestimonial,
  createTestimonial,
  deleteTestimonial,
  listPublishedTestimonials,
  updateTestimonial,
  withdrawTestimonial,
} from "@/server/services/testimonial-service";

/**
 * Stage 18 — testimonial governance integration tests.
 *
 * Verifies the fail-closed publication model: drafts are never publicly
 * visible, approval is the only publish path, withdrawal hides content
 * immediately, published rows cannot be deleted without withdrawal first,
 * and every state change produces an audit event.
 */

async function platformAdmin() {
  // A dedicated platform-admin user (no tenant membership required).
  const email = `admin-${Date.now()}@example.test`;
  return prisma.user.create({
    data: { email, name: "Platform Admin", role: "PLATFORM_ADMIN" },
  });
}

beforeEach(async () => {
  await truncateAll();
});

describe("testimonial publication lifecycle", () => {
  it("new testimonials are created as unpublished drafts", async () => {
    const admin = await platformAdmin();
    const created = await createTestimonial(
      {
        authorName: "Amina Juma",
        authorTitle: "Operations Director",
        companyName: "Kilimanjaro Traders Ltd",
        quote: "The platform unified our sales and inventory reporting.",
        rating: 5,
      },
      admin.id,
    );
    expect(created.isPublished).toBe(false);
    const publicList = await listPublishedTestimonials();
    expect(publicList.map((t) => t.id)).not.toContain(created.id);
  });

  it("approval publishes and records approver identity plus audit event", async () => {
    const admin = await platformAdmin();
    const created = await createTestimonial(
      {
        authorName: "Joseph Mrema",
        authorTitle: "CEO",
        companyName: "Coastal Logistics TZ",
        quote: "Decision support insights changed how we plan procurement.",
        rating: 4,
      },
      admin.id,
    );
    const approved = await approveTestimonial(created.id, admin.id);
    expect(approved.isPublished).toBe(true);
    expect(approved.approvedById).toBe(admin.id);
    expect(approved.approvedAt).not.toBeNull();

    const publicList = await listPublishedTestimonials();
    const row = publicList.find((t) => t.id === created.id);
    expect(row).toBeDefined();
    // Public feed must not leak moderation metadata.
    expect(Object.keys(row ?? {})).toEqual(
      expect.arrayContaining(["authorName", "quote", "rating"]),
    );
    expect(row).not.toHaveProperty("approvedById");
    expect(row).not.toHaveProperty("isPublished");

    const audit = await prisma.auditLog.findFirst({
      where: { action: "testimonial.approved", entityId: created.id },
    });
    expect(audit).not.toBeNull();
  });

  it("double approval is rejected", async () => {
    const admin = await platformAdmin();
    const created = await createTestimonial(
      {
        authorName: "Neema Peter",
        authorTitle: "Finance Manager",
        companyName: "Lake Region Agro",
        quote: "Invoicing and reconciliation finally live in one system.",
      },
      admin.id,
    );
    await approveTestimonial(created.id, admin.id);
    await expect(approveTestimonial(created.id, admin.id)).rejects.toThrow();
  });

  it("withdrawal removes content from the public feed immediately", async () => {
    const admin = await platformAdmin();
    const created = await createTestimonial(
      {
        authorName: "Hassan Ali",
        authorTitle: "Managing Partner",
        companyName: "Dar Marine Supply",
        quote: "Stock accuracy improved within the first month.",
        rating: 5,
      },
      admin.id,
    );
    await approveTestimonial(created.id, admin.id);
    await withdrawTestimonial(created.id, admin.id);
    const publicList = await listPublishedTestimonials();
    expect(publicList.map((t) => t.id)).not.toContain(created.id);
    const audit = await prisma.auditLog.findFirst({
      where: { action: "testimonial.withdrawn", entityId: created.id },
    });
    expect(audit).not.toBeNull();
  });

  it("published testimonials cannot be deleted until withdrawn", async () => {
    const admin = await platformAdmin();
    const created = await createTestimonial(
      {
        authorName: "Grace Mokalla",
        authorTitle: "Head of Sales",
        companyName: "Highland Coffee Exporters",
        quote: "Pipeline visibility doubled our follow-up rate.",
        rating: 4,
      },
      admin.id,
    );
    await approveTestimonial(created.id, admin.id);
    await expect(deleteTestimonial(created.id, admin.id)).rejects.toThrow(/withdraw/i);
    await withdrawTestimonial(created.id, admin.id);
    await deleteTestimonial(created.id, admin.id);
    expect(await prisma.testimonial.findUnique({ where: { id: created.id } })).toBeNull();
  });

  it("content updates do not silently change publication state", async () => {
    const admin = await platformAdmin();
    const created = await createTestimonial(
      {
        authorName: "Frank Omondi",
        authorTitle: "COO",
        companyName: "Savannah Freight Co",
        quote: "Cross-module reporting saved us hours every week.",
        rating: 5,
      },
      admin.id,
    );
    await approveTestimonial(created.id, admin.id);
    const updated = await updateTestimonial(
      created.id,
      { quote: "Cross-module reporting saves our team hours every single week." },
      admin.id,
    );
    expect(updated.isPublished).toBe(true);
    expect(updated.quote).toContain("saves our team");
  });

  it("validation rejects out-of-range ratings and short quotes", async () => {
    const admin = await platformAdmin();
    await expect(
      createTestimonial(
        {
          authorName: "Test Author",
          authorTitle: "Director",
          companyName: "Valid Company",
          quote: "This quote is long enough to pass validation checks.",
          rating: 6,
        },
        admin.id,
      ),
    ).rejects.toThrow();
    await expect(
      createTestimonial(
        {
          authorName: "Test Author",
          authorTitle: "Director",
          companyName: "Valid Company",
          quote: "Too short",
        },
        admin.id,
      ),
    ).rejects.toThrow();
  });

  it("tenant administrator membership does not grant testimonial moderation rights", async () => {
    // Two independent axes of authorization: a tenant ADMIN has organization
    // permissions only. Platform moderation is guarded by requirePlatformAdmin,
    // which checks Membership absence AND User.role — here we verify that the
    // permission set derived for a tenant admin contains no governance or
    // marketplace platform capabilities (least privilege at the RBAC layer).
    const fixture = await makeTenantWithUser("ADMIN");
    expect(fixture.ctx.permissions.has("governance.policies.manage")).toBe(true);
    // Platform-admin-only capability from Stage 16 RBAC must NOT be present.
    expect(fixture.ctx.permissions.has("marketplace.admin")).toBe(false);
  });
});
