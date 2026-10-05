import type { BADGE_TONE } from "@/components/dashboard/ui/badgeTones";
import type { BugSeverity, BugStatus } from "@/types/bugReport";

export const BUG_REPORT_QUERY_KEYS = {
  mine: ["bug-reports", "mine"] as const,
  list: (status?: string, severity?: string, page?: number) =>
    ["bug-reports", "list", status ?? null, severity ?? null, page ?? 0] as const,
  all: ["bug-reports"] as const,
};

export const BUG_REPORT_PAGE_SIZE = 20;
export const BUG_REPORT_TRIAGE_ROLES = ["ROLE_HR", "ROLE_ADMIN"] as const;

export const BUG_SEVERITY_OPTIONS: ReadonlyArray<{ value: BugSeverity; label: string; hint: string }> = [
  { value: "LOW", label: "Low", hint: "Cosmetic or minor" },
  { value: "MEDIUM", label: "Medium", hint: "Annoying, but I can work around it" },
  { value: "HIGH", label: "High", hint: "Blocks part of my work" },
  { value: "CRITICAL", label: "Critical", hint: "I can't use the app / data looks wrong" },
];

export const BUG_STATUS_OPTIONS: ReadonlyArray<{ value: BugStatus; label: string }> = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "WONT_FIX", label: "Won't fix" },
];

export const BUG_SEVERITY_TONE: Record<BugSeverity, keyof typeof BADGE_TONE> = {
  LOW: "slate",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "danger",
};

export const BUG_STATUS_TONE: Record<BugStatus, keyof typeof BADGE_TONE> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  WONT_FIX: "neutral",
};

export const BUG_REPORT_COPY = {
  buttonLabel: "Report a bug",
  dialogTitle: "Report a bug",
  dialogDescription: "Tell us what went wrong. HR and Admin are notified straight away.",
  titleLabel: "What went wrong?",
  titlePlaceholder: "e.g. Leave calendar shows a blank page",
  descriptionLabel: "Details",
  descriptionPlaceholder: "What were you doing, what did you expect, and what happened instead?",
  severityLabel: "How bad is it?",
  contextLabel: "Sent with your report",
  submit: "Send report",
  submitting: "Sending…",
  pageTitle: "Bug Reports",
  pageDescriptionTriage: "Everything employees have reported. Review, update the status and leave a note — the reporter is told.",
  pageDescriptionMine: "Problems you've reported and what happened to them.",
  emptyMine: "You haven't reported any bugs.",
  emptyTriage: "No bug reports match these filters.",
  allStatuses: "All statuses",
  allSeverities: "All severities",
  triage: "Review",
  triageTitle: "Review bug report",
  noteLabel: "Note to the reporter",
  notePlaceholder: "What you found, or what was done.",
  save: "Save",
  saving: "Saving…",
} as const;
