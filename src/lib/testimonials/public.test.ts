import { describe, expect, it } from "vitest";
import { toPublicTestimonial } from "@/lib/testimonials/public";

const source = {
  quote: "The workspace replaced four disconnected tools for our team.",
  authorName: "Amina Hassan",
  authorTitle: "Operations Director",
  company: "Northwind Trading",
  rating: 5,
  consentName: true,
  consentTitle: true,
  consentCompany: true,
};

describe("public testimonial mapping", () => {
  it("never exposes identifiers or private fields", () => {
    const result = toPublicTestimonial(source);
    expect(result).not.toHaveProperty("id");
    expect(result).not.toHaveProperty("tenantId");
    expect(result).not.toHaveProperty("submittedBy");
    expect(Object.keys(result).sort()).toEqual(
      ["authorName", "authorTitle", "company", "quote", "rating"].sort(),
    );
  });

  it("preserves identity fields when consent is granted", () => {
    expect(toPublicTestimonial(source)).toEqual({
      quote: source.quote,
      authorName: source.authorName,
      authorTitle: source.authorTitle,
      company: source.company,
      rating: source.rating,
    });
  });

  it("masks name, title and company independently", () => {
    const result = toPublicTestimonial({
      ...source,
      consentName: false,
      consentTitle: false,
      consentCompany: false,
    });

    expect(result.authorName).toBe("Verified customer");
    expect(result.authorTitle).toBeNull();
    expect(result.company).toBeNull();
    expect(result.quote).toBe(source.quote);
  });

  it("keeps consented fields while masking the others", () => {
    const result = toPublicTestimonial({
      ...source,
      consentName: false,
      consentTitle: true,
      consentCompany: false,
    });

    expect(result.authorName).toBe("Verified customer");
    expect(result.authorTitle).toBe(source.authorTitle);
    expect(result.company).toBeNull();
  });
});
