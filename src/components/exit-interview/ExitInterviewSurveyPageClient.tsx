"use client";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ExitInterviewSurveyPanel } from "@/components/exit-interview/ExitInterviewSurveyPanel";

export function ExitInterviewSurveyPageClient() {
  return (
    <DashboardPageShell>
      <div className="mx-auto max-w-3xl">
        <ExitInterviewSurveyPanel />
      </div>
    </DashboardPageShell>
  );
}
