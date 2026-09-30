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
 * that to an error after Submit.
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
        "scroll-mt-24 rounded-xl border bg-wt-surface-2/40 p-3.5",
        complete ? "border-emerald-500/30" : "border-wt-border"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium text-wt-text">
            {title}
            {complete ? <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-label="Complete" /> : null}
          </p>
          {detail ? <p className="text-xs text-wt-text-muted">{detail}</p> : null}
          {meta ? <p className="text-xs text-wt-text-muted">{meta}</p> : null}
        </div>
        <RatingButtons value={rated ? rating : null} onChange={onRating} disabled={disabled} />
      </div>
      <textarea
        value={comment}
        onChange={(event) => onComment(event.target.value)}
        disabled={disabled}
        rows={2}
        maxLength={1000}
        placeholder={PULSE_COPY.rowCommentPlaceholder}
        aria-label={`Why ${title}`}
        aria-required="true"
        className="mt-2.5 w-full resize-y rounded-lg border border-wt-border bg-wt-surface-1 px-3 py-2 text-sm text-wt-text placeholder:text-wt-text-faint focus:outline-none focus:ring-2 focus:ring-wt-brand/40 disabled:opacity-60"
      />
      {hint ? <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{hint}</p> : null}
    </div>
  );
}
