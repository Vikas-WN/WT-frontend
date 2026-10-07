"use client";

import { CheckCircle2 } from "lucide-react";

import { RatingButtons } from "@/components/dashboard/pulse/employee/RatingButtons";
import { PULSE_COPY } from "@/constants/pulseCopy";
import { cn } from "@/lib/utils";

/** The DOM id a checklist item scrolls to. */
export function explainedRowDomId(kind: "kpi" | "value", id: number): string {
  return `pulse-${kind}-${id}`;
}

/**
 * One KPI or Company Value: pick a level AND say why. The two belong together — a rating with
 * no reason isn't accepted — so the row shows which half is still missing rather than leaving
 * that to an error after Submit. The left edge turns green once both are in.
 */
export function ExplainedRatingRow({
  domId,
  title,
  meta,
  detail,
  rating,
  comment,
  onRating,
  onComment,
  disabled = false,
}: {
  domId: string;
  title: string;
  meta?: string | null;
  detail?: string | null;
  rating: number | null;
  comment: string;
  onRating: (rating: number) => void;
  onComment: (comment: string) => void;
  disabled?: boolean;
}) {
  const rated = rating != null && rating >= 1;
  const commented = comment.trim().length > 0;
  const complete = rated && commented;
  const hint = complete
    ? null
    : !rated && !commented
      ? PULSE_COPY.rowNeedsBoth
      : rated
        ? PULSE_COPY.rowNeedsComment
        : PULSE_COPY.rowNeedsRating;

  return (
    <div
      id={domId}
      className={cn(
        "relative scroll-mt-24 overflow-hidden rounded-2xl border bg-wt-surface-1 p-4 pl-5 transition-colors sm:p-5 sm:pl-6",
        complete ? "border-emerald-500/30" : "border-wt-border"
      )}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1 transition-colors", complete ? "bg-emerald-500" : rated || commented ? "bg-[var(--wt-brand)]/60" : "bg-wt-border-md")}
      />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-semibold leading-snug text-wt-text">{title}</p>
          {detail ? <p className="mt-1 text-xs leading-relaxed text-wt-text-muted">{detail}</p> : null}
          {meta ? <p className="mt-1 text-xs text-wt-text-faint">{meta}</p> : null}
        </div>
        {complete ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-label="Complete" /> : null}
      </div>
      <RatingButtons value={rated ? rating : null} onChange={onRating} disabled={disabled} label={title} />
      <textarea
        value={comment}
        onChange={(event) => onComment(event.target.value)}
        disabled={disabled}
        rows={2}
        maxLength={1000}
        placeholder={PULSE_COPY.rowCommentPlaceholder}
        aria-label={`Why ${title}`}
        aria-required="true"
        className="mt-3 w-full resize-y rounded-xl border border-wt-border bg-wt-surface-2/50 px-3.5 py-2.5 text-sm text-wt-text placeholder:text-wt-text-faint transition-colors focus:border-[var(--wt-brand)]/60 focus:bg-wt-surface-1 focus:outline-none focus:ring-2 focus:ring-[var(--wt-brand)]/25 disabled:opacity-60"
      />
      <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
        <span className={hint ? "text-amber-700 dark:text-amber-400" : "text-transparent"} aria-live="polite">
          {hint ?? "·"}
        </span>
        <span className="tabular-nums text-wt-text-faint">{comment.length}/1000</span>
      </div>
    </div>
  );
}
