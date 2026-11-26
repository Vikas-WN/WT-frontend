export const NEXT_BAND_KPIS_QUERY_KEY = ["profile", "next-band-kpis"] as const;

export const NEXT_BAND_KPIS_STALE_TIME_MS = 5 * 60_000;

export const NEXT_BAND_KPIS_COPY = {
  title: "Path to Promotion",
  intro: "These are the KPIs for the next band. Demonstrating them consistently is what you work towards for a promotion.",
  currentLabel: "Current",
  nextLabel: "Next band",
  notSet: "—",
  kpiColumn: "KPI",
  weightageColumn: "Weightage",
  emptyTitle: "No next-band KPIs to show",
  emptyFallback: "Next-band KPIs are not available for this profile yet.",
  errorTitle: "Could not load next-band KPIs",
  errorDescription: "Please try again in a moment.",
  retry: "Retry",
} as const;
