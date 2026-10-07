import { statusMeta, type StatusTone } from "@/components/dashboard/pulse/shared/submissionStatus";
import type { MonthlySubmissionItem, MonthlySubmissionReviewStatus } from "@/types/kpi";

export const ALL = "ALL" as const;
export type StatusFilter = typeof ALL | MonthlySubmissionReviewStatus;

/** Chip order = the order a submission travels through. */
export const STATUS_ORDER: readonly MonthlySubmissionReviewStatus[] = [
  "SUBMITTED",
  "NEEDS_REVIEW",
  "NEEDS_MANAGER_REVIEW",
  "MANAGER_SUBMITTED",
  "APPROVED",
  "DRAFT",
];

export interface MonthStats {
  total: number;
  approved: number;
  withManagers: number;
  sentBack: number;
  /** Mean of the final scores in this month, or null when none are final yet. */
  averageScore: number | null;
  byStatus: Record<string, number>;
  /** Segments for the stacked bar, in travel order, empty ones dropped. */
  segments: { status: MonthlySubmissionReviewStatus; count: number; tone: StatusTone }[];
}

export function computeMonthStats(rows: readonly MonthlySubmissionItem[]): MonthStats {
  const byStatus: Record<string, number> = {};
  let scoreSum = 0;
  let scored = 0;
  for (const row of rows) {
    const key = row.review_status ?? "DRAFT";
    byStatus[key] = (byStatus[key] ?? 0) + 1;
    if (row.review_status === "APPROVED" && row.final_score != null) {
      scoreSum += row.final_score;
      scored += 1;
    }
  }
  return {
    total: rows.length,
    approved: byStatus.APPROVED ?? 0,
    withManagers: (byStatus.SUBMITTED ?? 0) + (byStatus.NEEDS_MANAGER_REVIEW ?? 0) + (byStatus.MANAGER_SUBMITTED ?? 0),
    sentBack: (byStatus.NEEDS_REVIEW ?? 0) + (byStatus.NEEDS_MANAGER_REVIEW ?? 0),
    averageScore: scored ? scoreSum / scored : null,
    byStatus,
    segments: STATUS_ORDER.filter((s) => (byStatus[s] ?? 0) > 0).map((status) => ({
      status,
      count: byStatus[status],
      tone: statusMeta(status).tone,
    })),
  };
}

export function matchesQuery(row: MonthlySubmissionItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [row.employee.name, row.employee.emp_id, row.employee.email, row.reviewer?.name]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}
