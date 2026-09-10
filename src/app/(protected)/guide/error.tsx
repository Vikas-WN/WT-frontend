"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GuideError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Help & Guide failed to render:", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="text-lg font-semibold text-wt-text">
        The Help &amp; Guide couldn&apos;t load
      </h1>
      <p className="text-sm text-wt-text-muted">
        Something went wrong while opening the handbook. Try again — if it keeps
        happening, let IT know
        {error?.digest ? ` (ref ${error.digest})` : ""}.
      </p>
      <Button type="button" onClick={() => reset()}>
        Try again
      </Button>
    </main>
  );
}
