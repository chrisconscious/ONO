/**
 * Pure mapping from a stored testimonial to the public sign-in shape.
 *
 * The public object deliberately contains no identifiers and masks optional
 * identity fields unless the author gave consent for each one. Keeping this
 * function free of database access makes the privacy rules directly testable.
 */
export type PublicTestimonialSource = {
  quote: string;
  authorName: string;
  authorTitle: string | null;
  company: string | null;
  rating: number;
  consentName: boolean;
  consentTitle: boolean;
  consentCompany: boolean;
};

export type PublicTestimonial = {
  quote: string;
  authorName: string;
  authorTitle: string | null;
  company: string | null;
  rating: number;
};

export function toPublicTestimonial(
  row: PublicTestimonialSource,
): PublicTestimonial {
  return {
    quote: row.quote,
    authorName: row.consentName ? row.authorName : "Verified customer",
    authorTitle: row.consentTitle ? row.authorTitle : null,
    company: row.consentCompany ? row.company : null,
    rating: row.rating,
  };
}
