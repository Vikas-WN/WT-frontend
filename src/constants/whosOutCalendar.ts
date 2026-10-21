/** Monday-first, matching the grid. */
export const CALENDAR_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const CALENDAR_MAX_CHIPS = 3;

export const CALENDAR_COPY = {
  legendHoliday: "Holiday",
  legendOptional: "Optional holiday",
  more: (n: number) => `+${n} more`,
  outCount: (n: number) => `${n} out`,
  peopleOut: (n: number) => `${n} ${n === 1 ? "person" : "people"} out`,
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
  /** Short count text for a calendar cell, e.g. "5 on leave". */
  summary: (n: number) => string;
  /** Group heading colour in the day panel. */
  heading: string;
  /** Chip / badge colours (works in light and dark). */
  chip: string;
  dot: string;
  order: number;
}

/** How each kind of time off looks: leave stands out warm; work-from-home is the brand colour; extra WFH is violet. */
export const OUT_KINDS: Record<string, OutKindStyle> = {
  LEAVE: { label: "Leave", summary: (n) => `${n} on leave`, heading: "text-amber-800 dark:text-amber-300", chip: "bg-amber-500/14 text-amber-800 dark:text-amber-300", dot: "bg-amber-500", order: 0 },
  WFH: { label: "Work from home", summary: (n) => `${n} WFH`, heading: "text-emerald-800 dark:text-emerald-300", chip: "bg-emerald-500/14 text-emerald-800 dark:text-emerald-300", dot: "bg-emerald-600", order: 1 },
  WFH_EXCEPTION: { label: "Extra WFH", summary: (n) => `${n} extra WFH`, heading: "text-violet-700 dark:text-violet-300", chip: "bg-violet-500/14 text-violet-700 dark:text-violet-300", dot: "bg-violet-500", order: 2 },
};

export const OUT_KIND_FALLBACK: OutKindStyle = {
  label: "Other",
  summary: (n) => `${n} other`,
  heading: "text-wt-text-muted",
  chip: "bg-wt-surface-3 text-wt-text-muted",
  dot: "bg-wt-text-faint",
  order: 9,
};
