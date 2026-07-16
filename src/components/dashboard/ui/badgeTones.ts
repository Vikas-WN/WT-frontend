/** Filled status badges — no outline border, semantic background colors. */
export const FILLED_BADGE_BASE =
  "border-transparent rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight";

export const BADGE_TONE = {
  success:
    "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  danger: "bg-destructive/15 text-destructive dark:bg-destructive/20",
  warning: "bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300",
  info: "bg-[color-mix(in_srgb,var(--wt-brand)_14%,transparent)] text-[var(--wt-brand)] dark:bg-[color-mix(in_srgb,var(--wt-brand)_28%,transparent)] dark:text-[#b8c7e8]",
  violet:
    "bg-[color-mix(in_srgb,var(--wt-brand)_14%,transparent)] text-[var(--wt-brand)] dark:bg-[color-mix(in_srgb,var(--wt-brand)_28%,transparent)] dark:text-[#b8c7e8]",
  neutral: "bg-muted text-wt-text-muted dark:bg-wt-surface-3 dark:text-wt-text-muted",
  slate: "bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
} as const;

export function filledBadgeClass(tone: keyof typeof BADGE_TONE): string {
  return `${FILLED_BADGE_BASE} ${BADGE_TONE[tone]}`;
}
