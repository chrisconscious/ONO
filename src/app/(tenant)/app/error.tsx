"use client";

import { RouteError } from "@/components/app/route-states";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      title="This workspace page could not be loaded"
      description="The data could not be retrieved safely. Try again. If the problem continues, contact your workspace administrator and quote the support reference below."
      reference={error.digest}
      reset={reset}
      homeHref="/app"
      homeLabel="Back to overview"
    />
  );
}
