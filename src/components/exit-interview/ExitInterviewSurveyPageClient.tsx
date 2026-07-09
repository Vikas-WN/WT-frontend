"use client";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ExitInterviewSurveyPanel } from "@/components/exit-interview/ExitInterviewSurveyPanel";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";

export function ExitInterviewSurveyPageClient() {
  const { requiresExitSurvey } = useDashboardAccess();

  return (
    <DashboardPageShell>
      <div className="w-full">
        {requiresExitSurvey ? (
          <ExitInterviewSurveyPanel enabledByStatus className="w-full" />
        ) : (
          <div className="w-full rounded-2xl border border-wt-border bg-wt-surface-1 px-5 py-6 text-sm text-wt-text-muted">
            Exit survey is available only while you are serving notice.
          </div>
        )}
      </div>
    </DashboardPageShell>
  );
}
