import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentSession, toActor } from "@/lib/auth/session";
import { listPublishedTestimonials } from "@/server/services/testimonials/testimonials.service";
import { LoginForm } from "@/components/auth/login-form";
import { TestimonialCarousel } from "@/components/auth/testimonial-carousel";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your ONO workspace.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getCurrentSession();

  if (session) {
    const actor = toActor(session);
    const destination =
      actor.memberships.length > 0
        ? "/app"
        : actor.isPlatformAdmin
          ? "/admin"
          : "/access-denied?scope=workspace";
    redirect(destination);
  }

  const [{ next }, testimonials] = await Promise.all([
    searchParams,
    listPublishedTestimonials(),
  ]);

  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md"
      >
        Skip to sign-in form
      </a>

      <section className="flex flex-col px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
        <header>
          <Logo />
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <LoginForm next={next} />
          </div>
        </div>

        <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} ONO</span>
          <span aria-hidden="true" className="text-border">
            /
          </span>
          <span>Multi-tenant business operations platform</span>
        </footer>
      </section>

      <aside className="relative hidden overflow-hidden bg-slate-900 lg:block">
        <Image
          src="/media/login-team.jpg"
          alt="Business team collaborating around a table"
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/25"
        />

        <div className="relative flex h-full flex-col justify-between gap-10 p-10 xl:p-12">
          <Logo tone="inverse" showTagline />

          <div>
            <h2 className="max-w-lg text-3xl leading-tight font-semibold text-balance text-white xl:text-[2.1rem]">
              Manage your business. Grow without limits.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
              One tenant-aware platform for customers, revenue, finance,
              procurement and delivery — with the intelligence to act on it.
            </p>

            <TestimonialCarousel
              testimonials={testimonials}
              className="mt-8 max-w-lg"
            />
          </div>
        </div>
      </aside>
    </main>
  );
}
