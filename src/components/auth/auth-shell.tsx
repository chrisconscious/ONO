import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { TypewriterHeading } from "@/components/auth/typewriter-heading";
import {
  getAuthPagePreview,
  getPublishedAuthPage,
} from "@/server/services/platform/auth-page.service";

/**
 * Shared split-screen frame for every authentication screen.
 *
 * The left column is the form and stays narrow enough to read comfortably. The
 * right column carries the administrator-managed image and its testimonial
 * card; below the large breakpoint it stacks under the form so the testimonial
 * stays available on smaller screens.
 */
export async function AuthShell({
  children,
  aside,
  formId,
  skipLabel = "Skip to the form",
  preview = false,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
  formId: string;
  skipLabel?: string;
  /** Platform administrators can render the saved draft for review. */
  preview?: boolean;
}) {
  const content = preview
    ? await getAuthPagePreview()
    : await getPublishedAuthPage();

  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <a
        href={`#${formId}`}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md"
      >
        {skipLabel}
      </a>

      <section className="flex flex-col px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
        <header>
          <Link
            href="/"
            className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <Logo />
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} ONO</span>
          {content.smallText ? (
            <>
              <span aria-hidden="true" className="text-border">
                /
              </span>
              <span>{content.smallText}</span>
            </>
          ) : null}
        </footer>
      </section>

      <aside className="relative min-h-[28rem] overflow-hidden bg-slate-900 lg:min-h-0">
        {content.image.url ? (
          <Image
            src={content.image.url}
            alt={content.image.alt}
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            unoptimized={content.image.source === "upload"}
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#334155,#0f172a_65%)]"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-slate-950/15"
        />

        {preview ? (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/55 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm">
            <span className="font-medium text-white">Draft preview</span>
            <span aria-hidden="true" className="text-white/35">
              /
            </span>
            <Link
              href="/admin/authentication"
              className="rounded-sm underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Exit
            </Link>
          </div>
        ) : null}

        <div className="relative flex h-full flex-col justify-between gap-8 p-6 sm:p-8 xl:p-12">
          <Logo tone="inverse" showTagline />

          <div className="w-full">
            <div className="max-w-xl">
              {content.heading ? (
                <h2 className="relative text-3xl leading-tight font-semibold text-balance text-white xl:text-[2.1rem]">
                  <TypewriterHeading text={content.heading} />
                </h2>
              ) : null}
              {content.supportingText ? (
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                  {content.supportingText}
                </p>
              ) : null}
            </div>

            {aside ? (
              <div className="mt-6 w-full max-w-xl xl:mt-8">
                {aside}
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </main>
  );
}
