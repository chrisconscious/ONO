import { useState, useEffect } from 'react';
import { PublishedTestimonial } from '@/types/testimonial';
import { testimonialService } from '@/services/testimonialService';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

export function TestimonialCarousel() {
  const [testimonials, setTestimonials] = useState<PublishedTestimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, []);

  async function loadTestimonials() {
    try {
      const published = await testimonialService.getPublishedTestimonials();
      setTestimonials(published);
    } catch (error) {
      console.error('Failed to load testimonials:', error);
    } finally {
      setLoading(false);
    }
  }

  function goToPrevious() {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  }

  function goToNext() {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  }

  if (loading) {
    return null;
  }

  if (testimonials.length === 0) {
    return null;
  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Testimonial Card */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
        {/* Quote Icon */}
        <div className="mb-4">
          <svg className="w-12 h-12 text-white/40" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>

        {/* Testimonial Text */}
        <p className="text-white text-lg md:text-xl font-medium leading-relaxed mb-6">
          "{currentTestimonial.testimonialText}"
        </p>

        {/* Rating Stars */}
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < currentTestimonial.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-white/30'
              }`}
            />
          ))}
        </div>

        {/* Client Info */}
        <div className="border-t border-white/20 pt-4">
          <p className="text-white font-semibold text-base">
            {currentTestimonial.clientName}
          </p>
          <p className="text-white/80 text-sm">
            {currentTestimonial.clientTitle}
          </p>
          <p className="text-white/60 text-sm">
            {currentTestimonial.companyName}
          </p>
        </div>
      </div>

      {/* Navigation Controls */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={goToPrevious}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* Indicators */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
