"use client";

import { Check, Hourglass } from "lucide-react";

import { groupKpisByParameter, hasKpiParameters } from "@/utils/kpiParameters";
import { cn } from "@/lib/utils";
import type { MonthlySubmissionItem } from "@/types/kpi";

type Stage = { label: string; state: "done" | "current" | "todo" };

/** Where a submitted review stands: Submitted → Manager review → HR approval. */
function stagesFor(row: MonthlySubmissionItem): Stage[] {
  const status = row.review_status;
  const submitted = Boolean(status && status !== "DRAFT");
  const managerDone = status === "MANAGER_SUBMITTED" || status === "APPROVED";
  const approved = status === "APPROVED";
  const reviewer = row.reviewer ? `${row.reviewer.name}'s review` : "Manager review";
  return [
    { label: submitted ? "Submitted" : "Not submitted", state: submitted ? "done" : "current" },
    { label: reviewer, state: managerDone ? "done" : submitted ? "current" : "todo" },
    { label: "HR approval", state: approved ? "done" : managerDone ? "current" : "todo" },
  ];
}

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
  const stages = stagesFor(submission);
  const mine = new Map(submission.kpi_ratings.map((r) => [r.kpi_id, r.rating]));
  const manager = submission.manager_evaluation?.kpi_ratings ?? {};
  const managerValues = submission.manager_evaluation?.value_ratings ?? {};
  const approved = submission.review_status === "APPROVED";
  const params = hasKpiParameters(submission.kpi_details);

  return (
    <div className="space-y-4">
      <ol className="grid gap-2 sm:grid-cols-3">
        {stages.map((stage) => (
          <li
            key={stage.label}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium",
              stage.state === "done" && "border-emerald-500/30 bg-emerald-500/10 text-wt-text",
              stage.state === "current" && "border-[var(--wt-brand)]/40 bg-[var(--wt-brand-soft)] text-wt-text",
              stage.state === "todo" && "border-wt-border bg-wt-surface-1 text-wt-text-faint"
            )}
          >
            {stage.state === "done" ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Hourglass className="size-4 opacity-60" aria-hidden />}
            {stage.label}
          </li>
        ))}
      </ol>

      {submission.manager_review?.comments ? (
        <blockquote className="rounded-xl border border-wt-border bg-wt-surface-1 p-4 text-sm text-wt-text-muted">
          <span className="block text-xs font-semibold uppercase tracking-wide text-wt-text-faint">Manager&apos;s comment</span>
          &ldquo;{submission.manager_review.comments}&rdquo;
        </blockquote>
      ) : null}

      {approved && submission.final_score != null ? (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div>
            <p className="text-xs text-wt-text-muted">Final score</p>
            <p className="text-2xl font-semibold tabular-nums text-wt-text">{submission.final_score}</p>
          </div>
          {submission.promotion_eligible ? <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">Promotion eligible</span> : null}
        </div>
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
