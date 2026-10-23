// Testimonial domain types and interfaces

export type TestimonialStatus = 
  | 'pending'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'changes_requested'
  | 'archived';

export interface Testimonial {
  id: string;
  userId: string;
  organizationId: string;
  companyName: string;
  clientName: string;
  clientTitle: string;
  testimonialText: string;
  rating: number; // 1-5
  status: TestimonialStatus;
  consentGiven: boolean;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  publishedAt?: Date;
  updatedAt: Date;
  displayOrder?: number;
  isFeatured?: boolean;
}

export interface TestimonialSubmission {
  testimonialText: string;
  rating: number;
  consentGiven: boolean;
}

export interface TestimonialModeration {
  status: TestimonialStatus;
  reviewNotes?: string;
  editedText?: string;
  editedClientName?: string;
  editedClientTitle?: string;
  editedCompanyName?: string;
  displayOrder?: number;
  isFeatured?: boolean;
}

export interface PublishedTestimonial {
  id: string;
  clientName: string;
  clientTitle: string;
  companyName: string;
  testimonialText: string;
  rating: number;
  publishedAt: Date;
}
