"use client";

import { RatingButtons } from "@/components/dashboard/pulse/employee/RatingButtons";
import { pulseRatingLabel } from "@/constants/pulseRatings";
import { cn } from "@/lib/utils";

export const SIDE_BY_SIDE_GRID =
  "grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_minmax(0,22rem)] sm:items-start sm:gap-4";

export function SideBySideHeader() {
  return (
    <div
      className={cn(
        SIDE_BY_SIDE_GRID,
        "mt-2 mb-1.5 hidden px-3 text-[11px] font-medium uppercase tracking-wide text-wt-text-muted sm:grid"
      )}
    >
      <span>Item</span>
      <span className="text-center">Employee</span>
      <span>Shared rating</span>
    </div>
  );
}

/** One KPI/value: the employee's self-rating (read-only) next to the shared
 *  manager rating, so both are visible at a glance. */
export function SideBySideRow({
  title,
  meta,
  detail,
  selfRating,
  managerRating,
  onRate,
  disabled = false,
}: {
  title: string;
  meta?: string | null;
  detail?: string | null;
  selfRating: number | null;
  managerRating: number | null;
  onRate: (rating: number) => void;
  disabled?: boolean;
}) {
  const direction =
    managerRating != null && selfRating != null && managerRating !== selfRating
      ? managerRating > selfRating
        ? "Higher than the employee"
        : "Lower than the employee"
      : null;
  return (
    <div
      className={cn(
        SIDE_BY_SIDE_GRID,
        "rounded-lg border bg-wt-surface-2/40 px-3 py-2.5",
        managerRating == null ? "border-wt-border" : "border-wt-brand/30"
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-wt-text">{title}</p>
        {meta ? <p className="text-xs text-wt-text-muted">{meta}</p> : null}
        {detail ? <p className="mt-0.5 text-xs text-wt-text-faint">{detail}</p> : null}
      </div>
      <div className="flex items-center gap-2 sm:justify-center">
        <span className="text-xs text-wt-text-muted sm:hidden">Employee</span>
        <span className="rounded-lg border border-wt-border bg-wt-surface-1 px-2 py-1 text-center text-xs font-medium leading-tight text-wt-text">
          {pulseRatingLabel(selfRating)}
        </span>
      </div>
      <div className="space-y-1">
        <RatingButtons value={managerRating} onChange={onRate} disabled={disabled} />
        {direction ? <p className="text-xs text-amber-700 dark:text-amber-400">{direction}</p> : null}
      </div>
    </div>
  );
}
