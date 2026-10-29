import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground">
        <FileQuestionIcon className="size-5" aria-hidden="true" />
      </span>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The page or record does not exist, or it is not available in the
          workspace you are currently using.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button render={<Link href="/app" />}>Back to workspace</Button>
        <Button variant="outline" render={<Link href="/admin" />}>
          Platform console
        </Button>
      </div>
    </main>
  );
}
