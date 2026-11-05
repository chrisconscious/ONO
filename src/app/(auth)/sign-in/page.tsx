import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentActor, readSessionEndReason } from "@/lib/auth/session";
import { resolvePostAuthDestination } from "@/lib/auth/destination";
import { isSafeInternalPath } from "@/lib/auth/redirect";
import { listPublishedTestimonials } from "@/server/services/testimonials/testimonials.service";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { TestimonialCarousel } from "@/components/auth/testimonial-carousel";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your ONO account.",
};

export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  expired:
    "Your session ended because it was inactive for too long. Sign in again to continue where you left off.",
  revoked:
    "Your session was ended for a security reason. Sign in again to continue.",
  logout: "You have been signed out.",
  "signed-out": "You have been signed out.",
  verified: "Your email address is verified. Sign in to continue.",
  "password-reset": "Your password was updated. Sign in with your new password.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    reason?: string;
    email?: string;
    preview?: string;
  }>;
}) {
  const params = await searchParams;
  const next = isSafeInternalPath(params.next) ? params.next : undefined;
  const preview = params.preview === "auth-page";

  const actor = await getCurrentActor();
  if (preview) {
    // Draft previews are restricted to platform administrators on the server.
    if (!actor?.isPlatformAdmin) notFound();
  } else if (actor) {
    redirect(resolvePostAuthDestination(actor, next));
  }

  const cookieReason = await readSessionEndReason();
  const reason = params.reason ?? cookieReason ?? undefined;
  const notice = reason ? notices[reason] : undefined;

  const testimonials = await listPublishedTestimonials();

  return (
    <AuthShell
      formId="sign-in-form"
      skipLabel="Skip to sign-in form"
      preview={preview}
      aside={<TestimonialCarousel testimonials={testimonials} />}
    >
      <SignInForm next={next} email={params.email} notice={notice} />
    </AuthShell>
  );
}
