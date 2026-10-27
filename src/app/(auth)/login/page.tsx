import { Building2 } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { TestimonialCarousel } from "@/components/testimonials/testimonial-carousel";

/**
 * Split-screen authentication page (login-02 layout).
 *
 * Left: real credential form. Right: large business image panel with the
 * approved tagline and a translucent testimonial card fed exclusively by the
 * published-testimonials API (never fabricated content).
 */
export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 font-medium">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="size-4" aria-hidden="true" />
            </div>
            ClickIT Solutions
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        {/* Business-intelligence imagery via next/image for optimization. */}
        <picture className="absolute inset-0 block">
          <img
            src="/images/login-business.svg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        <div
          className="absolute inset-x-0 top-0 z-10 flex flex-col items-start gap-2 p-10"
          aria-hidden="false"
        >
          <span className="rounded-full border border-white/25 bg-black/30 px-3 py-1 text-xs font-medium tracking-wide text-white backdrop-blur-sm">
            ClickIT Business Platform
          </span>
          <h2 className="max-w-md text-3xl font-semibold leading-tight text-white drop-shadow-lg">
            Manage your business. Grow without limits.
          </h2>
        </div>
        {/* Testimonial card sits over the lower portion of the image panel. */}
        <div className="absolute inset-x-8 bottom-8 z-10 mx-auto max-w-xl">
          <TestimonialCarousel />
        </div>
      </div>
    </div>
  );
}
