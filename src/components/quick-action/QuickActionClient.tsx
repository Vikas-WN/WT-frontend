"use client";

import { giveFeedback } from "@/lib/feedback";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";

import { ApiError } from "@/api/error";
import { QuickActionCard } from "@/components/quick-action/QuickActionCard";
import { QuickActionResult, type ResultKind } from "@/components/quick-action/QuickActionResult";
import { WebTrakBrand } from "@/components/shared/WebTrakBrand";
import { Button } from "@/components/ui/button";
import { QUICK_ACTION_COPY as COPY } from "@/constants/quickAction";
import { quickActionService } from "@/services/quickAction.service";
import type { QuickActionDecision } from "@/types/quickAction";
import { applyResolvedTheme, resolveThemePreference } from "@/utils/dashboard/theme";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-wt-page-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <WebTrakBrand variant="header" />
        </div>
        <div className="overflow-hidden rounded-3xl border border-wt-border bg-wt-surface-1 shadow-[var(--wt-shadow-lg)]">{children}</div>
      </div>
    </main>
  );
}

function QuickActionFlow({ token }: { token: string }) {
  const preview = useQuery({
    queryKey: ["quick-action", token],
    queryFn: async () => (await quickActionService.preview(token)).data ?? null,
    staleTime: Infinity,
    retry: false,
  });
  // UI-only: the outcome once the person has decided, or the error from trying.
  const [outcome, setOutcome] = useState<ResultKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = useMutation({
    mutationFn: ({ action, message }: { action: QuickActionDecision; message?: string }) =>
      quickActionService.decide(token, action, message),
    onSuccess: (_res, { action }) => {
      giveFeedback(action === "APPROVED" ? "approve" : "reject");
      setOutcome(action === "APPROVED" ? "approved" : "rejected");
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 410) return setOutcome("expired");
      // The backend words these for people ("This request has already been approved."), so show them as they are.
      setError(err instanceof ApiError && err.message ? err.message : COPY.loadError);
    },
  });

  if (outcome) return <QuickActionResult kind={outcome} />;
  if (preview.isLoading) return <div className="h-72 animate-pulse bg-wt-surface-2" aria-busy />;
  if (preview.isError) {
    return (
      <div className="space-y-4 px-6 py-10 text-center">
        <p className="text-sm text-wt-text-muted">{COPY.loadError}</p>
        <Button variant="outline" onClick={() => preview.refetch()}>
          {COPY.retry}
        </Button>
      </div>
    );
  }
  const data = preview.data;
  if (!data || data.state === "expired") return <QuickActionResult kind="expired" />;
  if (data.state === "decided") return <QuickActionResult kind="decided" />;

  return (
    <>
      <QuickActionCard preview={data} busy={decide.isPending} onDecide={(action, message) => { setError(null); decide.mutate({ action, message }); }} />
      {error ? <p role="alert" className="border-t border-wt-border bg-rose-500/10 px-6 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
    </>
  );
}

/** Public confirm page behind the "Review & decide" button in approval emails. */
export function QuickActionClient({ token }: { token: string }) {
  const [client] = useState(() => new QueryClient());

  // Follow the device's light/dark setting — there's no signed-in preference to read on a public page.
  useEffect(() => {
    applyResolvedTheme(resolveThemePreference("system"));
  }, []);

  return (
    <QueryClientProvider client={client}>
      <Shell>
        <QuickActionFlow token={token} />
      </Shell>
    </QueryClientProvider>
  );
}
