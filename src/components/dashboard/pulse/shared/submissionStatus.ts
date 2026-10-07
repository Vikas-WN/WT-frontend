import type { MonthlySubmissionItem, MonthlySubmissionReviewStatus } from "@/types/kpi";

export type StatusTone = "neutral" | "info" | "warning" | "danger" | "success";

export interface StatusMeta {
  label: string;
  /** Who has to act next, in a few words. */
  waitingOn: string;
  tone: StatusTone;
}

const META: Record<MonthlySubmissionReviewStatus, StatusMeta> = {
  DRAFT: { label: "Draft", waitingOn: "Employee", tone: "neutral" },
  SUBMITTED: { label: "With managers", waitingOn: "Manager review", tone: "info" },
  NEEDS_REVIEW: { label: "Sent back to employee", waitingOn: "Employee", tone: "warning" },
  NEEDS_MANAGER_REVIEW: { label: "Sent back to managers", waitingOn: "Manager review", tone: "warning" },
  MANAGER_SUBMITTED: { label: "Awaiting HR (older)", waitingOn: "HR approval", tone: "info" },
  APPROVED: { label: "Final", waitingOn: "Done", tone: "success" },
};

export function statusMeta(status: MonthlySubmissionReviewStatus | null | undefined): StatusMeta {
  return (status && META[status]) || { label: "Not started", waitingOn: "Employee", tone: "neutral" };
}

export const TONE_PILL_CLASS: Record<StatusTone, string> = {
  neutral: "border-wt-border bg-wt-surface-2 text-wt-text-muted",
  info: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  danger: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

export const TONE_DOT_CLASS: Record<StatusTone, string> = {
  neutral: "bg-wt-text-faint",
  info: "bg-sky-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  success: "bg-emerald-500",
};

export type StageState = "done" | "current" | "todo";
export interface Stage {
  key: "employee" | "manager" | "hr";
  label: string;
  state: StageState;
}

/** Employee → Manager → HR, and where a submission stands among them. */
export function stagesOf(row: Pick<MonthlySubmissionItem, "review_status" | "reviewer">): Stage[] {
  const status = row.review_status;
  const submitted = Boolean(status && status !== "DRAFT" && status !== "NEEDS_REVIEW");
  const managerDone = status === "MANAGER_SUBMITTED" || status === "APPROVED";
  const approved = status === "APPROVED";
  return [
    { key: "employee", label: "Submitted", state: submitted ? "done" : "current" },
    { key: "manager", label: row.reviewer ? "Reviewer" : "Manager", state: managerDone ? "done" : submitted ? "current" : "todo" },
    { key: "hr", label: "Final", state: approved ? "done" : managerDone ? "current" : "todo" },
  ];
}
