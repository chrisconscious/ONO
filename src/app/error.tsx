"use client";

import { RouteError } from "@/components/app/route-states";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl items-center px-4 py-10">
      <RouteError
        title="ONO could not load this page"
        description="An unexpected error interrupted the request. Try again. If the problem continues, contact your administrator with the support reference below."
        reference={error.digest}
        reset={reset}
        homeHref="/"
        homeLabel="Go to start"
      />
    </main>
  );
}
