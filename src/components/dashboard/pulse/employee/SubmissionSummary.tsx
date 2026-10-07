"use client";

import { Quote } from "lucide-react";

import { StagePipeline } from "@/components/dashboard/pulse/shared/StagePipeline";
import { StatusPill } from "@/components/dashboard/pulse/shared/StatusPill";
import { statusMeta } from "@/components/dashboard/pulse/shared/submissionStatus";
import { groupKpisByParameter, hasKpiParameters } from "@/utils/kpiParameters";
import { cn } from "@/lib/utils";
import type { MonthlySubmissionItem } from "@/types/kpi";

function Rating({ value, muted }: { value: number | null | undefined; muted?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums",
        value == null ? "border-dashed border-wt-border text-wt-text-faint" : muted ? "border-wt-border bg-wt-surface-2 text-wt-text" : "border-[var(--wt-brand)]/30 bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]"
      )}
    >
      {value ?? "–"}
    </span>
  );
}

/** Read-only view of one month's review: progress, scores, and the ratings
 *  side by side (yours | your manager's). Used once the review has left the
 *  employee, and for months whose window has closed. */
export function SubmissionSummary({ submission }: { submission: MonthlySubmissionItem }) {
  const meta = statusMeta(submission.review_status);
  const mine = new Map(submission.kpi_ratings.map((r) => [r.kpi_id, r.rating]));
  const manager = submission.manager_evaluation?.kpi_ratings ?? {};
  const managerValues = submission.manager_evaluation?.value_ratings ?? {};
  const approved = submission.review_status === "APPROVED";
  const params = hasKpiParameters(submission.kpi_details);

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-3xl border border-wt-border bg-wt-surface-1 p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_120%_at_0%_0%,color-mix(in_srgb,var(--wt-brand)_8%,transparent),transparent_60%)]"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0 space-y-2">
            <StatusPill status={submission.review_status} />
            <p className="text-sm text-wt-text-muted">
              {approved ? "This review is final." : meta.waitingOn === "Employee" ? "Waiting on you." : `Waiting on: ${meta.waitingOn.toLowerCase()}.`}
            </p>
            <StagePipeline row={submission} showLabels className="pt-1" />
          </div>
          {approved && submission.final_score != null ? (
            <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-3">
              <div>
                <p className="text-xs font-medium text-wt-text-muted">Final score</p>
                <p className="text-3xl font-bold tabular-nums tracking-tight text-wt-text">{submission.final_score}</p>
              </div>
              {submission.promotion_eligible ? (
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">Promotion eligible</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {submission.manager_review?.comments ? (
        <figure className="rounded-2xl border border-wt-border bg-wt-surface-1 p-5">
          <Quote className="size-5 text-[var(--wt-brand)]/60" aria-hidden />
          <blockquote className="mt-2 text-sm leading-relaxed text-wt-text">{submission.manager_review.comments}</blockquote>
          <figcaption className="mt-2 text-xs font-medium text-wt-text-muted">
            Manager&apos;s comment{submission.manager_review.reviewed_by ? ` · ${submission.manager_review.reviewed_by}` : ""}
          </figcaption>
        </figure>
      ) : null}

      <section className="rounded-2xl border border-wt-border bg-wt-surface-1">
        <header className="grid grid-cols-[minmax(0,1fr)_4rem_4rem] items-center gap-2 border-b border-wt-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-wt-text-muted">
          <span>KPI</span>
          <span className="text-center">You</span>
          <span className="text-center">Manager</span>
        </header>
        {groupKpisByParameter(submission.kpi_details).map((group) => (
          <div key={group.parameter ?? "_none"}>
            {params ? <p className="bg-wt-surface-2/60 px-4 py-1.5 text-xs font-semibold text-wt-text-muted">{group.parameter ?? "Other"}</p> : null}
            {group.items.map((kpi) => (
              <div key={kpi.id} className="grid grid-cols-[minmax(0,1fr)_4rem_4rem] items-center gap-2 border-t border-wt-border px-4 py-2.5 first:border-t-0">
                <span className="truncate text-sm text-wt-text">{kpi.kpi_name}</span>
                <span className="flex justify-center"><Rating value={mine.get(kpi.id)} muted /></span>
                <span className="flex justify-center"><Rating value={manager[String(kpi.id)]} /></span>
              </div>
            ))}
          </div>
        ))}
        {submission.value_ratings.length > 0 ? (
          <>
            <p className="border-t border-wt-border bg-wt-surface-2/60 px-4 py-1.5 text-xs font-semibold text-wt-text-muted">Company values</p>
            {submission.value_ratings.map((v) => (
              <div key={v.value_id} className="grid grid-cols-[minmax(0,1fr)_4rem_4rem] items-center gap-2 border-t border-wt-border px-4 py-2.5">
                <span className="truncate text-sm text-wt-text">{submission.value_details.find((d) => d.id === v.value_id)?.name ?? `Value #${v.value_id}`}</span>
                <span className="flex justify-center"><Rating value={v.rating} muted /></span>
                <span className="flex justify-center"><Rating value={managerValues[String(v.value_id)]} /></span>
              </div>
            ))}
          </>
        ) : null}
      </section>

      {submission.self_review_text ? (
        <section className="rounded-2xl border border-wt-border bg-wt-surface-1 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-wt-text-faint">Your self review</h3>
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-wt-text">{submission.self_review_text}</p>
        </section>
      ) : null}
    </div>
  );
}
