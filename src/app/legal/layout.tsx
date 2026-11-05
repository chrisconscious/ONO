import Link from "next/link";
import { Logo } from "@/components/brand/logo";

/** Plain, readable frame for the legal pages linked from sign-up. */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-6">
          <Link
            href="/"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <Logo />
          </Link>
          <nav aria-label="Legal" className="flex items-center gap-4 text-sm">
            <Link
              href="/legal/terms"
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/legal/privacy"
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/sign-in"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <article className="space-y-6 text-sm leading-relaxed text-muted-foreground [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h2]:pt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
          {children}
        </article>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-1 px-6 py-6 text-xs text-muted-foreground">
          <span>Ac {new Date().getFullYear()} ONO</span>
          <span aria-hidden="true">/</span>
          <span>Multi-tenant business operations platform</span>
        </div>
      </footer>
    </div>
  );
}
