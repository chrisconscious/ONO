// Testimonial service - handles all testimonial operations
// In production, this would connect to a real database via API calls

import { Testimonial, TestimonialSubmission, TestimonialModeration, TestimonialStatus, PublishedTestimonial } from '@/types/testimonial';

const STORAGE_KEY = 'clickit_testimonials';

// Helper functions for localStorage
function getStoredTestimonials(): Testimonial[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const testimonials = JSON.parse(stored);
    return testimonials.map((t: any) => ({
      ...t,
      submittedAt: new Date(t.submittedAt),
      reviewedAt: t.reviewedAt ? new Date(t.reviewedAt) : undefined,
      publishedAt: t.publishedAt ? new Date(t.publishedAt) : undefined,
      updatedAt: new Date(t.updatedAt),
    }));
  } catch {
    return [];
  }
}

function saveTestimonials(testimonials: Testimonial[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(testimonials));
}

// Generate unique ID
function generateId(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validation
function validateSubmission(submission: TestimonialSubmission): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!submission.testimonialText || submission.testimonialText.trim().length === 0) {
    errors.push('Testimonial text is required');
  }
  
  if (submission.testimonialText.length > 1000) {
    errors.push('Testimonial text must be less than 1000 characters');
  }
  
  if (!submission.rating || submission.rating < 1 || submission.rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }
  
  if (!submission.consentGiven) {
    errors.push('Consent is required to publish testimonial');
  }
  
  return { valid: errors.length === 0, errors };
}

// Service functions
export const testimonialService = {
  // Submit a new testimonial (client action)
  async submitTestimonial(
    userId: string,
    organizationId: string,
    companyName: string,
    clientName: string,
    clientTitle: string,
    submission: TestimonialSubmission
  ): Promise<{ success: boolean; testimonial?: Testimonial; errors?: string[] }> {
    // Validate submission
    const validation = validateSubmission(submission);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Verify user has permission to submit for this organization
    // In production, this would check actual tenant membership
    if (!userId || !organizationId) {
      return { success: false, errors: ['User must be authenticated'] };
    }

    const testimonials = getStoredTestimonials();
    
    const newTestimonial: Testimonial = {
      id: generateId(),
      userId,
      organizationId,
      companyName,
      clientName,
      clientTitle,
      testimonialText: submission.testimonialText.trim(),
      rating: submission.rating,
      status: 'pending',
      consentGiven: submission.consentGiven,
      submittedAt: new Date(),
      updatedAt: new Date(),
    };

    testimonials.push(newTestimonial);
    saveTestimonials(testimonials);

    return { success: true, testimonial: newTestimonial };
  },

  // Get all testimonials for a user (client view)
  async getUserTestimonials(userId: string): Promise<Testimonial[]> {
    const testimonials = getStoredTestimonials();
    return testimonials.filter(t => t.userId === userId);
  },

  // Get all testimonials (Super Admin view)
  async getAllTestimonials(): Promise<Testimonial[]> {
    return getStoredTestimonials();
  },

  // Get testimonials by status (Super Admin view)
  async getTestimonialsByStatus(status: TestimonialStatus): Promise<Testimonial[]> {
    const testimonials = getStoredTestimonials();
    return testimonials.filter(t => t.status === status);
  },

  // Get published testimonials (public view)
  async getPublishedTestimonials(): Promise<PublishedTestimonial[]> {
    const testimonials = getStoredTestimonials();
    return testimonials
      .filter(t => t.status === 'published' && t.consentGiven)
      .sort((a, b) => {
        // Sort by display order first, then by published date
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
          return a.displayOrder - b.displayOrder;
        }
        if (a.displayOrder !== undefined) return -1;
        if (b.displayOrder !== undefined) return 1;
        return (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0);
      })
      .map(t => ({
        id: t.id,
        clientName: t.clientName,
        clientTitle: t.clientTitle,
        companyName: t.companyName,
        testimonialText: t.testimonialText,
        rating: t.rating,
        publishedAt: t.publishedAt || t.updatedAt,
      }));
  },

  // Get a single testimonial by ID
  async getTestimonialById(id: string): Promise<Testimonial | null> {
    const testimonials = getStoredTestimonials();
    return testimonials.find(t => t.id === id) || null;
  },

  // Moderate a testimonial (Super Admin action)
  async moderateTestimonial(
    testimonialId: string,
    moderatorId: string,
    moderation: TestimonialModeration
  ): Promise<{ success: boolean; testimonial?: Testimonial; errors?: string[] }> {
    // Verify moderator is Super Admin
    // In production, this would check actual role
    if (!moderatorId) {
      return { success: false, errors: ['Moderator must be authenticated'] };
    }

    const testimonials = getStoredTestimonials();
    const index = testimonials.findIndex(t => t.id === testimonialId);
    
    if (index === -1) {
      return { success: false, errors: ['Testimonial not found'] };
    }

    const testimonial = testimonials[index];

    // Validate status transition
    const validTransitions: Record<TestimonialStatus, TestimonialStatus[]> = {
      pending: ['approved', 'rejected', 'changes_requested'],
      approved: ['published', 'rejected', 'changes_requested', 'archived'],
      published: ['approved', 'archived', 'rejected'],
      rejected: ['approved', 'archived'],
      changes_requested: ['pending', 'approved', 'archived'],
      archived: [],
    };

    const currentStatus = testimonial.status;
    const allowedTransitions = validTransitions[currentStatus] || [];
    
    if (!allowedTransitions.includes(moderation.status)) {
      return { 
        success: false, 
        errors: [`Cannot transition from ${currentStatus} to ${moderation.status}`] 
      };
    }

    // Update testimonial
    testimonial.status = moderation.status;
    testimonial.reviewedAt = new Date();
    testimonial.reviewedBy = moderatorId;
    testimonial.reviewNotes = moderation.reviewNotes;
    testimonial.updatedAt = new Date();

    // Apply edits if provided
    if (moderation.editedText !== undefined) {
      testimonial.testimonialText = moderation.editedText;
    }
    if (moderation.editedClientName !== undefined) {
      testimonial.clientName = moderation.editedClientName;
    }
    if (moderation.editedClientTitle !== undefined) {
      testimonial.clientTitle = moderation.editedClientTitle;
    }
    if (moderation.editedCompanyName !== undefined) {
      testimonial.companyName = moderation.editedCompanyName;
    }
    if (moderation.displayOrder !== undefined) {
      testimonial.displayOrder = moderation.displayOrder;
    }
    if (moderation.isFeatured !== undefined) {
      testimonial.isFeatured = moderation.isFeatured;
    }

    // Set published date if publishing
    if (moderation.status === 'published') {
      testimonial.publishedAt = new Date();
    } else {
      testimonial.publishedAt = undefined;
    }

    testimonials[index] = testimonial;
    saveTestimonials(testimonials);

    return { success: true, testimonial };
  },

  // Delete a testimonial (Super Admin action)
  async deleteTestimonial(testimonialId: string, moderatorId: string): Promise<{ success: boolean; errors?: string[] }> {
    if (!moderatorId) {
      return { success: false, errors: ['Moderator must be authenticated'] };
    }

    const testimonials = getStoredTestimonials();
    const index = testimonials.findIndex(t => t.id === testimonialId);
    
    if (index === -1) {
      return { success: false, errors: ['Testimonial not found'] };
    }

    testimonials.splice(index, 1);
    saveTestimonials(testimonials);

    return { success: true };
  },

  // Get testimonial statistics (Super Admin view)
  async getTestimonialStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    published: number;
    rejected: number;
    changesRequested: number;
    archived: number;
  }> {
    const testimonials = getStoredTestimonials();
    return {
      total: testimonials.length,
      pending: testimonials.filter(t => t.status === 'pending').length,
      approved: testimonials.filter(t => t.status === 'approved').length,
      published: testimonials.filter(t => t.status === 'published').length,
      rejected: testimonials.filter(t => t.status === 'rejected').length,
      changesRequested: testimonials.filter(t => t.status === 'changes_requested').length,
      archived: testimonials.filter(t => t.status === 'archived').length,
    };
  },
};
