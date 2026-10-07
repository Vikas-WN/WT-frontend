"use client";

import { RatingButtons } from "@/components/dashboard/pulse/employee/RatingButtons";
import { PULSE_COPY } from "@/constants/pulseCopy";
import { pulseRatingLabel } from "@/constants/pulseRatings";
import { cn } from "@/lib/utils";

export const SIDE_BY_SIDE_GRID =
  "grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-start sm:gap-4";

export function SideBySideHeader() {
  return (
    <div
      className={cn(
        SIDE_BY_SIDE_GRID,
        "mt-2 mb-1.5 hidden px-3 text-[11px] font-medium uppercase tracking-wide text-wt-text-muted sm:grid"
      )}
    >
      <span>Item</span>
      <span className="text-center">Employee rated</span>
    </div>
  );
}

/** One KPI/value: the employee's self-rating (read-only) next to the shared
 *  manager rating, so both are visible at a glance. */
export function SideBySideRow({
  domId,
  title,
  meta,
  detail,
  selfRating,
  selfComment,
  managerRating,
  managerComment,
  onRate,
  onComment,
  disabled = false,
}: {
  domId: string;
  title: string;
  meta?: string | null;
  detail?: string | null;
  selfRating: number | null;
  /** Why the employee gave themselves that rating. */
  selfComment?: string | null;
  managerRating: number | null;
  managerComment: string;
  onRate: (rating: number) => void;
  onComment: (comment: string) => void;
  disabled?: boolean;
}) {
  const direction =
    managerRating != null && selfRating != null && managerRating !== selfRating
      ? managerRating > selfRating
        ? "Higher than the employee"
        : "Lower than the employee"
      : null;
  const complete = managerRating != null && managerComment.trim().length > 0;
  return (
    <div
      id={domId}
      className={cn(
        "scroll-mt-24 rounded-2xl border bg-wt-surface-1 p-4",
        complete ? "border-emerald-500/30" : managerRating == null ? "border-wt-border" : "border-wt-brand/30"
      )}
    >
    <div className={SIDE_BY_SIDE_GRID}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-wt-text">{title}</p>
        {meta ? <p className="text-xs text-wt-text-muted">{meta}</p> : null}
        {detail ? <p className="mt-0.5 text-xs text-wt-text-faint">{detail}</p> : null}
      </div>
      <div className="flex items-center gap-2 sm:justify-center">
        <span className="text-xs text-wt-text-muted sm:hidden">Employee</span>
        <span className="rounded-lg border border-wt-border bg-wt-surface-2 px-2.5 py-1 text-center text-xs font-medium leading-tight text-wt-text">
          {pulseRatingLabel(selfRating)}
        </span>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <RatingButtons value={managerRating} onChange={onRate} disabled={disabled} label={title} />
        {direction ? <p className="text-xs text-amber-700 dark:text-amber-400">{direction}</p> : null}
      </div>
    </div>
    {selfComment?.trim() ? (
      <p className="mt-3 rounded-xl bg-wt-surface-2/60 px-3 py-2 text-xs text-wt-text-muted">
        <span className="font-medium text-wt-text">Employee&apos;s reason: </span>
        {selfComment}
      </p>
    ) : null}
    <textarea
      value={managerComment}
      onChange={(event) => onComment(event.target.value)}
      disabled={disabled}
      rows={2}
      maxLength={1000}
      placeholder={PULSE_COPY.managerRowCommentPlaceholder}
      aria-label={`Your reason for ${title}`}
      aria-required="true"
      className="mt-3 w-full resize-y rounded-xl border border-wt-border bg-wt-surface-2/50 px-3.5 py-2.5 text-sm text-wt-text placeholder:text-wt-text-faint transition-colors focus:border-[var(--wt-brand)]/60 focus:bg-wt-surface-1 focus:outline-none focus:ring-2 focus:ring-[var(--wt-brand)]/25 disabled:opacity-60"
    />
    {managerRating != null && managerComment.trim().length === 0 ? (
      <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{PULSE_COPY.rowNeedsComment}</p>
    ) : null}
    </div>
  );
}
