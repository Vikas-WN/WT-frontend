import type { TeamCalendarCellKind } from "@/utils/timelog/teamCalendar";

export const TEAM_CALENDAR_COPY = {
  searchPlaceholder: "Search people",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  person: "Person",
  total: "Hours",
  loading: "Loading the team calendar…",
  empty: "No one matches.",
  holidaysHeading: "Holidays this month",
  noHolidays: "No holidays this month.",
  optionalSuffix: "optional",
  downloadPdf: "Download PDF",
  downloadingPdf: "Preparing PDF…",
  downloadPdfDone: "Timelog PDF downloaded.",
  downloadPdfFailed: "Could not download the timelog PDF. Try again.",
  hint: "Hours are approved time logs. Leave and work from home are approved requests.",
} as const;

/** How each kind of day looks and what the legend calls it. Order is the legend's order. */
export const TEAM_CALENDAR_KINDS: ReadonlyArray<{
  kind: TeamCalendarCellKind;
  label: string;
  symbol: string;
  className: string;
}> = [
  { kind: "hours", label: "Hours logged", symbol: "8", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  { kind: "leave", label: "On leave", symbol: "L", className: "bg-sky-500/20 text-sky-700 dark:text-sky-300" },
  { kind: "half-leave", label: "Half-day leave", symbol: "½L", className: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  { kind: "wfh", label: "Work from home", symbol: "WFH", className: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  { kind: "holiday", label: "Holiday", symbol: "H", className: "bg-amber-500/20 text-amber-800 dark:text-amber-300" },
  { kind: "missing", label: "Nothing logged", symbol: "·", className: "bg-rose-500/10 text-rose-600 dark:text-rose-300" },
  { kind: "weekend", label: "Weekend", symbol: "", className: "bg-wt-surface-2 text-wt-text-faint" },
  { kind: "future", label: "Upcoming", symbol: "", className: "text-wt-text-faint" },
];
