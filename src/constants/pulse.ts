import type { SubmissionCycleScope } from "@/types/kpi";

/** TanStack Query keys for Pulse. Everything lives under "pulse" so one
 *  invalidation refreshes every Pulse screen after a write. */
export const PULSE_QUERY_KEYS = {
  all: ["pulse"] as const,
  window: (month: string, purpose: string) => ["pulse", "window", month, purpose] as const,
  mySubmission: (month: string) => ["pulse", "my-submission", month] as const,
  history: ["pulse", "my-history"] as const,
  draft: (month: string) => ["pulse", "draft", month] as const,
  kpis: ["pulse", "applicable-kpis"] as const,
  values: ["pulse", "values"] as const,
  certifications: ["pulse", "certifications"] as const,
  projects: ["pulse", "projects"] as const,
  adminReviewers: ["pulse", "admin-reviewers"] as const,
  managerTeam: ["pulse", "manager-team"] as const,
  cycles: ["pulse", "cycles"] as const,
  candidates: (query: string) => ["pulse", "window-candidates", query] as const,
  scoring: ["pulse", "scoring"] as const,
};

/** How many months back the month picker reaches. */
export const PULSE_MONTHS_BACK = 12;

export const WINDOW_SCOPE_LABELS: Record<SubmissionCycleScope, string> = {
  GLOBAL: "Everyone",
  EMPLOYEE: "Employees",
  MANAGER: "Managers",
  PERSON: "Individual",
};

/** The one-line meaning of each window, shown on the Submission Portal. */
export const WINDOW_SCOPE_HINTS: Record<SubmissionCycleScope, string> = {
  GLOBAL: "Opens Pulse for every employee and manager at once.",
  EMPLOYEE: "Opens Pulse for employees only. Managers are not affected.",
  MANAGER: "Opens Pulse for managers only — their own review and their team reviews.",
  PERSON: "Opens Pulse for one named employee, e.g. a late submission.",
};
