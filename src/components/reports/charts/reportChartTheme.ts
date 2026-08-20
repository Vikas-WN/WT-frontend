/** Shared palette for HR report charts — brand-first, readable in light/dark. */
export const REPORT_CHART_COLORS = [
  "var(--wt-brand)",
  "#0d9488",
  "#d97706",
  "#e11d48",
  "#6366f1",
  "#0891b2",
  "#ca8a04",
  "#7c3aed",
] as const;

export const REPORT_CHART_MUTED = "var(--wt-text-muted)";
export const REPORT_CHART_GRID = "color-mix(in srgb, var(--wt-border) 80%, transparent)";
export const REPORT_CHART_TOOLTIP_BG = "var(--wt-surface-1)";
export const REPORT_CHART_TOOLTIP_BORDER = "var(--wt-border)";
export const REPORT_CHART_TOOLTIP_TEXT = "var(--wt-text)";
