"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Profile Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-xl border border-wt-border bg-wt-surface-1 p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-wt-text">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-wt-text-muted">
          The profile page encountered an error. If you were filling out the
          onboarding form, your entered data should be preserved after reloading.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button variant="brand" onClick={reset}>
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
}
