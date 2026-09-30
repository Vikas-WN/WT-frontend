/**
 * Shared status-pill tones for timelog entries (draft / submitted / approved /
 * rejected). These don't map onto the employee-lifecycle `wt-status-badge`
 * tones (active/inactive/invited/serving-notice) in globals.css, so they get
 * their own small semantic palette here — used by both TimelogTable and
 * DayEntriesPanel so the same status always reads the same way everywhere.
 *
 * "pending" is a legacy alias for "submitted": an awaiting-decision entry must
 * not fall through to the neutral "draft" styling, which reads as "not
 * submitted yet" — the opposite of true.
 */
const TIMELOG_STATUS_BADGE_CLASS: Record<string, string> = {
  draft: "border-wt-border-md bg-wt-surface-2 text-wt-text-muted",
  submitted:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-300",
  pending:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-300",
  approved:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-300",
};

export function timelogStatusBadgeClass(status: string): string {
  const key = String(status ?? "").trim().toLowerCase();
  return TIMELOG_STATUS_BADGE_CLASS[key] ?? TIMELOG_STATUS_BADGE_CLASS.draft;
}
