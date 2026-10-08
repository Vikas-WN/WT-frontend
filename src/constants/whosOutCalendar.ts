/** Monday-first, matching the grid. */
export const CALENDAR_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const CALENDAR_MAX_CHIPS = 3;

export const CALENDAR_COPY = {
  legendHoliday: "Holiday",
  legendOptional: "Optional holiday",
  more: (n: number) => `+${n} more`,
  outCount: (n: number) => `${n} out`,
  panelEmpty: "Nobody is out this day.",
  panelPick: "Pick a day to see who is out.",
  optionalTag: "optional",
  halfDay: "Half day",
  today: "Today",
  viewCalendar: "Calendar",
  viewAgenda: "Agenda",
} as const;

export interface OutKindStyle {
  label: string;
  /** Chip / badge colours (works in light and dark). */
  chip: string;
  dot: string;
  order: number;
}

/** How each kind of time off looks: leave stands out warm; work-from-home is the brand colour; extra WFH is violet. */
export const OUT_KINDS: Record<string, OutKindStyle> = {
  LEAVE: { label: "Leave", chip: "bg-amber-500/14 text-amber-800 dark:text-amber-300", dot: "bg-amber-500", order: 0 },
  WFH: { label: "Work from home", chip: "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]", dot: "bg-[var(--wt-brand)]", order: 1 },
  WFH_EXCEPTION: { label: "Extra WFH", chip: "bg-violet-500/14 text-violet-700 dark:text-violet-300", dot: "bg-violet-500", order: 2 },
};

export const OUT_KIND_FALLBACK: OutKindStyle = {
  label: "Other",
  chip: "bg-wt-surface-3 text-wt-text-muted",
  dot: "bg-wt-text-faint",
  order: 9,
};
