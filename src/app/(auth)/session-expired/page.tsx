import type { Metadata } from "next";
import Link from "next/link";
import { ClockIcon } from "lucide-react";
import { isSafeInternalPath } from "@/lib/auth/redirect";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Session ended",
  description: "Your ONO session ended. Sign in again to continue.",
};

export const dynamic = "force-dynamic";

/**
 * Explains an ended session. Guards normally redirect straight to the sign-in
 * screen with a reason; this page exists for direct visits and older links.
 */
export default async function SessionExpiredPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = isSafeInternalPath(next) ? next : undefined;

  const signInHref = safeNext
    ? `/sign-in?reason=expired&next=${encodeURIComponent(safeNext)}`
    : "/sign-in?reason=expired";

  return (
    <AuthShell formId="session-expired" skipLabel="Skip to session message">
      <div id="session-expired" className="flex flex-col gap-5">
        <div className="flex size-11 items-center justify-center rounded-full bg-warning/10 text-warning">
          <ClockIcon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Your session ended
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            For your security, ONO ends sessions after a period of inactivity or
            when your account&apos;s access changes. Your saved business data is
            untouched.
          </p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href={signInHref} />}
          size="lg"
          className="h-10 w-full"
        >
          Sign in again
        </Button>

        <p className="border-t border-border pt-5 text-sm text-muted-foreground">
          <Link
            href="/"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Return to the ONO home screen
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
