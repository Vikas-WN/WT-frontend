"use client";

import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Send } from "lucide-react";

import { KpiStep } from "@/components/dashboard/pulse/employee/review/KpiStep";
import { StepRail } from "@/components/dashboard/pulse/employee/review/StepRail";
import { SubmitStep } from "@/components/dashboard/pulse/employee/review/SubmitStep";
import { ValuesStep } from "@/components/dashboard/pulse/employee/review/ValuesStep";
import { WorkStep } from "@/components/dashboard/pulse/employee/review/WorkStep";
import { REVIEW_STEPS, type ReviewContext, type ReviewStepId } from "@/components/dashboard/pulse/employee/review/reviewModel";
import { useReviewForm, type SaveState } from "@/components/dashboard/pulse/employee/review/useReviewForm";
import { ProgressBar } from "@/components/dashboard/pulse/shared/ProgressBar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MonthlySubmissionItem } from "@/types/kpi";

const SAVE_LABEL: Record<SaveState, string> = { saved: "All changes saved", saving: "Saving…", error: "Couldn't save — retrying on your next edit" };

function RevisionNotice({ submission }: { submission: MonthlySubmissionItem }) {
  const byHr = submission.admin_review?.action === "REJECT";
  const comment = (byHr ? submission.admin_review?.comments : submission.manager_review?.comments) || "Update your review and resubmit.";
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-wt-text">{byHr ? "HR sent this back for changes" : "Sent back for changes"}</p>
        <p className="mt-1 text-sm text-wt-text-muted">{comment}</p>
      </div>
    </div>
  );
}

/** The monthly self-review: step rail + one step at a time, with the
 *  progress header and the Back / Next / Submit bar always in view. */
export function ReviewForm({
  initial,
  ctx,
  projectsLoading,
  needsRevision,
  onSubmitted,
}: {
  initial: MonthlySubmissionItem;
  ctx: ReviewContext;
  projectsLoading: boolean;
  needsRevision: boolean;
  onSubmitted: () => void;
}) {
  const api = useReviewForm(initial, ctx, onSubmitted);
  const [step, setStep] = useState<ReviewStepId>("work");
  const index = REVIEW_STEPS.findIndex((s) => s.id === step);
  const isLast = index === REVIEW_STEPS.length - 1;
  const { progress } = api;
  const pct = progress.overall.total === 0 ? 100 : Math.round((progress.overall.done / progress.overall.total) * 100);

  return (
    <div className="space-y-4">
      {needsRevision ? <RevisionNotice submission={initial} /> : null}

      <div className="rounded-2xl border border-wt-border bg-wt-surface-1 px-4 py-3 sm:px-5">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-wt-text">{pct}% complete</span>
          <span className={cn("text-wt-text-muted", api.saveState === "error" && "text-rose-600")}>{SAVE_LABEL[api.saveState]}</span>
        </div>
        <ProgressBar done={progress.overall.done} total={progress.overall.total} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[14.5rem_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <StepRail active={step} progress={progress} onSelect={setStep} />
        </div>
        <div className="min-w-0 space-y-4">
          {step === "work" ? <WorkStep api={api} ctx={ctx} projectsLoading={projectsLoading} /> : null}
          {step === "kpis" ? <KpiStep api={api} ctx={ctx} /> : null}
          {step === "values" ? <ValuesStep api={api} ctx={ctx} /> : null}
          {step === "submit" ? <SubmitStep api={api} ctx={ctx} /> : null}

          <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-2xl border border-wt-border bg-wt-surface-1/95 px-3 py-2.5 shadow-[var(--wt-shadow-lg)] backdrop-blur sm:px-4">
            <Button type="button" variant="outline" onClick={() => setStep(REVIEW_STEPS[Math.max(0, index - 1)].id)} disabled={index === 0}>
              <ChevronLeft className="size-4" /> Back
            </Button>
            {isLast ? (
              <div className="flex min-w-0 items-center gap-3">
                {!progress.canSubmit ? (
                  <span className="hidden truncate text-xs text-wt-text-muted sm:block">To do: {progress.missing.join(" · ")}</span>
                ) : null}
                <Button type="button" variant="brand" onClick={api.actions.send} disabled={api.submitting || !progress.canSubmit}>
                  <Send className="size-4" /> {api.submitting ? "Submitting…" : "Submit self review"}
                </Button>
              </div>
            ) : (
              <Button type="button" variant="brand" onClick={() => setStep(REVIEW_STEPS[index + 1].id)}>
                Next <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
