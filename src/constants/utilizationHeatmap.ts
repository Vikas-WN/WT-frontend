import type { UtilizationLevel } from "@/types/utilization";

export const UTILIZATION_QUERY_KEY = ["reports", "utilization-weekly"] as const;
export const UTILIZATION_WEEK_OPTIONS = [4, 8, 12] as const;
export const UTILIZATION_DEFAULT_WEEKS = 8;
/** How many weeks before the current one the view starts at, so a bit of recent history is visible. */
export const UTILIZATION_WEEKS_BEFORE_NOW = 2;

export type UtilizationMetric = "planned" | "actual";

export const UTILIZATION_COPY = {
  title: "Utilisation heatmap",
  description: "Who is over- or under-used, week by week — planned from allocations, or actual from logged hours.",
  planned: "Planned",
  plannedHint: "From allocations",
  actual: "Actual",
  actualHint: "From logged hours",
  allDepartments: "All departments",
  searchPlaceholder: "Search a person…",
  thisWeek: "This week",
  earlier: "Earlier",
  later: "Later",
  weeksLabel: (n: number) => `${n} weeks`,
  person: "Person",
  average: "Average",
  teamRow: (n: number) => `${n} ${n === 1 ? "person" : "people"}`,
  noData: "Nobody matches these filters.",
  loadError: "Couldn't load utilisation. Try again.",
  retry: "Try again",
  onLeaveAllWeek: "on leave",
  detailPlanned: "Planned",
  detailActual: "Logged",
  detailLeave: "Approved leave",
  detailHours: (h: number) => `${h} h`,
  detailDays: (d: number) => `${d} ${d === 1 ? "day" : "days"}`,
  summaryOver: "Over-allocated",
  summaryOverHint: "above 100% planned",
  summaryFull: "Fully used",
  summaryFullHint: "80–100%",
  summaryPartial: "Partly used",
  summaryPartialHint: "40–80%",
  summaryBench: "Under-used",
  summaryBenchHint: "below 40%",
  focusWeek: (label: string) => `Week of ${label}`,
  legendTitle: "Planned load",
  cellOpen: "Show details for this week",
} as const;

/** One look per band, used by the cells, the summary tiles and the legend so they always agree. */
export const UTILIZATION_LEVEL_STYLE: Record<UtilizationLevel, { cell: string; dot: string; label: string }> = {
  over: { cell: "bg-rose-500 text-white", dot: "bg-rose-500", label: "Over" },
  full: { cell: "bg-emerald-500/85 text-white", dot: "bg-emerald-500", label: "Full" },
  partial: { cell: "bg-amber-400/80 text-amber-950", dot: "bg-amber-400", label: "Partial" },
  bench: { cell: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200", dot: "bg-slate-400", label: "Light" },
  none: { cell: "bg-wt-surface-2 text-wt-text-faint", dot: "bg-wt-surface-3", label: "—" },
};
