/**
 * Human-readable status labels for UI — never show raw API enums.
 */

import type { BADGE_TONE } from "@/components/dashboard/ui/badgeTones";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUBMITTED: "Submitted",
  DRAFT: "Draft",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  INVITED: "Invited",
  ONBOARDING: "Onboarding",
  SERVING_NOTICE: "Serving Notice",
  IN_NOTICE: "Serving Notice",
  OFFBOARDED: "Inactive",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  CANCELED: "Cancelled",
  IN_PROGRESS: "In Progress",
  SCHEDULED: "Scheduled",
  VERIFIED: "Verified",
  FAILED: "Failed",
  SKIPPED: "Skipped",
  SENT: "Sent",
  BILLED: "Billed",
  BUFFER: "Buffer",
  INVESTMENT: "Investment",
  DEPLOYABLE: "Deployable",
  LOCKED: "Locked",
  STAFFING: "Staffing",
  OPEN: "Open",
  CLOSED: "Closed",
  EXPIRED: "Expired",
  ENROLLED: "Enrolled",
  WITHDRAWN: "Withdrawn",
  PRESENT: "Present",
  ABSENT: "Absent",
};

/** Normalize any status-like value to a compact UPPER_SNAKE key. */
export function normalizeStatusKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

/**
 * Title Case label for any status enum / code.
 * Known keys use curated copy; unknown keys are Title-Cased from underscores.
 */
export function formatUiStatusLabel(value: unknown): string {
  const key = normalizeStatusKey(value);
  if (!key) return "—";
  if (STATUS_LABELS[key]) return STATUS_LABELS[key];
  return key
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Semantic tone for common workflow statuses. */
export function uiStatusTone(value: unknown): keyof typeof BADGE_TONE {
  const key = normalizeStatusKey(value);
  if (
    key === "APPROVED" ||
    key === "ACTIVE" ||
    key === "COMPLETED" ||
    key === "VERIFIED" ||
    key === "SENT"
  ) {
    return "success";
  }
  if (
    key === "REJECTED" ||
    key === "INACTIVE" ||
    key === "CANCELLED" ||
    key === "CANCELED" ||
    key === "FAILED" ||
    key === "EXPIRED"
  ) {
    return "danger";
  }
  if (
    key === "PENDING" ||
    key === "SUBMITTED" ||
    key === "DRAFT" ||
    key === "INVITED" ||
    key === "ONBOARDING" ||
    key === "SERVING_NOTICE" ||
    key === "IN_NOTICE" ||
    key === "SCHEDULED" ||
    key === "IN_PROGRESS"
  ) {
    return "warning";
  }
  if (key === "BILLED" || key === "DEPLOYABLE" || key === "OPEN") {
    return "info";
  }
  return "neutral";
}
