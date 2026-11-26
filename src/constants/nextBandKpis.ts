export const NEXT_BAND_KPIS_QUERY_KEY = ["profile", "next-band-kpis"] as const;

export const NEXT_BAND_KPIS_STALE_TIME_MS = 5 * 60_000;

export const NEXT_BAND_KPIS_COPY = {
  tabLabel: "Path to Promotion",
  pulseDescription: "See what the next band expects of you, so you know what to work on.",
  heading: "What the next band expects",
  intro:
    "These KPIs are what the next band is measured on. Build a track record against them in your monthly Pulse reviews and you're working towards your promotion.",
  currentLabel: "Current band",
  nextLabel: "Next band",
  departmentLabel: "Department",
  designationLabel: "Designation",
  notSet: "Not set",
  kpiCount: (count: number) => `${count} ${count === 1 ? "KPI" : "KPIs"}`,
  emptyTitle: "No next-band KPIs to show",
  emptyFallback: "Next-band KPIs are not available for your profile yet.",
  errorTitle: "Could not load your path to promotion",
  errorDescription: "Please try again in a moment.",
  retry: "Retry",
  loading: "Loading your path to promotion",
} as const;
