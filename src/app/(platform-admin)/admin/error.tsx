"use client";

import { RouteError } from "@/components/app/route-states";

export default function PlatformAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      title="This platform page could not be loaded"
      description="The operation did not complete. Try again. If the problem continues, contact the platform operations owner and quote the support reference below."
      reference={error.digest}
      reset={reset}
      homeHref="/admin"
      homeLabel="Back to platform overview"
    />
  );
}
