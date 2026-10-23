import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { testimonialService } from '@/services/testimonialService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function TestimonialSubmissionForm() {
  const { user } = useAuth();
  const [testimonialText, setTestimonialText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('idle');
    setErrors([]);

    if (!user) {
      setErrors(['You must be logged in to submit a testimonial']);
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await testimonialService.submitTestimonial(
        user.id,
        user.organizationId || '',
        user.organizationId || 'Your Company',
        user.name || user.email,
        'Team Member',
        {
          testimonialText,
          rating,
          consentGiven,
        }
      );

      if (result.success) {
        setSubmitStatus('success');
        setTestimonialText('');
        setRating(0);
        setConsentGiven(false);
      } else {
        setErrors(result.errors || ['Failed to submit testimonial']);
        setSubmitStatus('error');
      }
    } catch (error) {
      setErrors(['An unexpected error occurred']);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submit a Testimonial</CardTitle>
          <CardDescription>
            Please log in to submit a testimonial about your experience with ClickIT.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Share Your Experience</CardTitle>
        <CardDescription>
          Help others understand the value of ClickIT by sharing your experience. Your testimonial will be reviewed before publication.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Thank you for your testimonial!</p>
                <p className="text-sm text-green-700">
                  Your submission has been received and is pending review by our team.
                </p>
              </div>
            </div>
          )}

          {submitStatus === 'error' && errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Submission failed</p>
                  <ul className="text-sm text-red-700 list-disc list-inside mt-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <Label>How would you rate your experience?</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Testimonial Text */}
          <div className="space-y-2">
            <Label htmlFor="testimonial">Your Testimonial</Label>
            <textarea
              id="testimonial"
              value={testimonialText}
              onChange={(e) => setTestimonialText(e.target.value)}
              placeholder="Share your experience with ClickIT. What has worked well for your business? How has it helped you?"
              className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={1000}
              required
              disabled={isSubmitting}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Be specific and authentic</span>
              <span>{testimonialText.length}/1000</span>
            </div>
          </div>

          {/* Consent */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
              <span className="text-sm text-gray-700">
                I consent to ClickIT publishing my testimonial along with my name, title, and company name. 
                I understand that my submission will be reviewed before publication and that I can request 
                removal at any time.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !testimonialText || !rating || !consentGiven}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Testimonial'
            )}
          </Button>

          {/* Info Text */}
          <p className="text-xs text-center text-gray-500">
            Your testimonial will be reviewed by our team before publication. We may contact you if we need clarification.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
