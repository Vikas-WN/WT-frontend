export interface KpiDefinitionItem {
  id: number;
  band_id: number;
  department: string;
  designation: string;
  kpi_name: string;
  /** Group the KPI rolls up to; its weight is the sum of its KPIs' weightage. */
  parameter: string | null;
  evaluation_criteria: string | null;
  weightage: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KpiDefinitionWritePayload {
  band_id: number;
  department: string;
  designation: string;
  kpi_name: string;
  parameter: string | null;
  evaluation_criteria: string | null;
  weightage: number;
  active: boolean;
}

/** GLOBAL opens Pulse for everyone, EMPLOYEE for employees only, MANAGER for
 *  managers only, PERSON for one named employee (see `user_id`). */
export type SubmissionCycleScope = "GLOBAL" | "EMPLOYEE" | "MANAGER" | "PERSON";

/** Who a PERSON window belongs to. */
export interface SubmissionCycleUser {
  id: number;
  name: string;
  email: string;
  emp_id: string | null;
}

export interface SubmissionCycleItem {
  id: number;
  /** `YYYY-MM` — the review month this window opens Pulse for. */
  cycle_key: string;
  scope: SubmissionCycleScope;
  user_id: number | null;
  user: SubmissionCycleUser | null;
  window_start_at: string;
  window_end_at: string | null;
  manual_closed: boolean;
  /** Computed server-side: inside the window and not manually closed. */
  is_open: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionCycleWritePayload {
  cycle_key: string;
  scope: SubmissionCycleScope;
  /** Required for PERSON windows, forbidden otherwise. */
  user_id?: number | null;
  window_start_at: string;
  window_end_at: string | null;
  manual_closed: boolean;
}

export interface SubmissionWindowStatus {
  scope: string;
  cycle_key: string;
  open: boolean;
  resolved_scope: SubmissionCycleScope | null;
  /** When the open window(s) end — null when open-ended or closed. */
  window_end_at?: string | null;
}

/** What a window check is for: filling in my own review, or reviewing my team. */
export type PulseWindowPurpose = "self" | "team";

export interface WebknotValueItem {
  id: number;
  title: string;
  evaluation_criteria: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebknotValueWritePayload {
  title: string;
  evaluation_criteria: string | null;
  active: boolean;
}

export interface PaginatedWebknotValues {
  data: WebknotValueItem[];
  current_page: number;
  page_size: number;
  total_element: number;
  total_page: number;
}

export interface CertificationItem {
  id: number;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertificationWritePayload {
  name: string;
  active: boolean;
}

// --- Pulse: monthly self-review submissions ---

export type MonthlySubmissionType = "EMPLOYEE_MONTHLY_SUBMISSION" | "MANAGER_SELF_REVIEW";

export type MonthlySubmissionReviewStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "NEEDS_REVIEW"
  | "MANAGER_SUBMITTED"
  | "NEEDS_MANAGER_REVIEW"
  | "APPROVED";

export interface KpiRating {
  kpi_id: number;
  rating: number;
  /** Why this rating was given — required to submit. */
  comment: string;
}

export interface ValueRating {
  value_id: number;
  rating: number;
  comment: string;
}

export interface CertificationClaim {
  certification_id: number;
  proof: string;
}

export interface MonthlySubmissionDraftPayload {
  month: string;
  submission_type: MonthlySubmissionType;
  self_review_text: string;
  kpi_ratings: KpiRating[];
  value_ratings: ValueRating[];
  certifications: CertificationClaim[];
  project_codes: string[];
  recognitions_count: number;
  /** DM / PM / AM / HR / Admin only — the HR or Admin who reviews this submission. */
  reviewer_id?: number | null;
}

export interface EmployeeSummary {
  id: number;
  name: string;
  email: string;
  emp_id: string | null;
}

export interface ManagerEvaluation {
  kpi_ratings: Record<string, number>;
  value_ratings: Record<string, number>;
  /** Why each rating was given, keyed like the ratings. */
  kpi_comments: Record<string, string>;
  value_comments: Record<string, string>;
  comments: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface ReviewDecision {
  action: string;
  comments: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface AdminReviewDecision extends ReviewDecision {
  tech_showcase: string | null;
}

export interface SubmissionKpiDetail {
  id: number;
  kpi_name: string;
  parameter: string | null;
  evaluation_criteria: string | null;
  weightage: number;
}

export interface NamedRef {
  id: number;
  name: string;
}

export interface MonthlySubmissionItem {
  id: number;
  employee: EmployeeSummary;
  month: string;
  cycle_key: string;
  cycle_label: string;
  submission_type: MonthlySubmissionType;
  status: string;
  review_status: MonthlySubmissionReviewStatus | null;
  self_review_text: string;
  kpi_ratings: KpiRating[];
  value_ratings: ValueRating[];
  certifications: CertificationClaim[];
  project_codes: string[];
  recognitions_count: number;
  /** DM / PM / AM / HR / Admin submissions: the HR or Admin chosen to review it. */
  reviewer_id: number | null;
  reviewer: EmployeeSummary | null;
  /** The project managers this went to — any one of them can finalize it. */
  managers: EmployeeSummary[];
  /** Reviewers only: the in-progress review the assigned managers share. */
  manager_draft: ManagerReviewDraft | null;
  /** Names for the ids above — every KPI applicable to the employee plus any rated. */
  kpi_details: SubmissionKpiDetail[];
  value_details: NamedRef[];
  certification_details: NamedRef[];
  manager_evaluation: ManagerEvaluation | null;
  manager_review: ReviewDecision | null;
  admin_review: AdminReviewDecision | null;
  /** HR corrections made during this review round, oldest first. */
  admin_edits: AdminEditRecord[];
  final_score: number | null;
  employee_rating_display: string | null;
  manager_rating_display: string | null;
  admin_rating_display: string | null;
  promotion_eligible: boolean;
  locked: boolean;
  reopened_for_resubmission: boolean;
  submitted_at: string | null;
  manager_submitted_at: string | null;
  admin_submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminEditRecord {
  edited_by: string;
  edited_at: string | null;
  reason: string;
  /** e.g. "self_review", "employee_kpi_ratings", "manager_value_ratings", "final_score". */
  fields: string[];
}

/** HR/Admin correction — only the fields sent change; ratings merge by id. */
export interface AdminEditPayload {
  reason: string;
  self_review_text?: string;
  kpi_ratings?: KpiRating[];
  value_ratings?: ValueRating[];
  manager_kpi_ratings?: KpiRating[];
  manager_value_ratings?: ValueRating[];
  manager_comments?: string;
  /** Approved submissions only; omitted = recomputed from the edited ratings. */
  final_score?: number;
}

/** The one not-yet-submitted review every assigned manager shares. */
export interface ManagerReviewDraft {
  kpi_ratings: Record<string, number>;
  value_ratings: Record<string, number>;
  kpi_comments: Record<string, string>;
  value_comments: Record<string, string>;
  comments: string;
  /** Bumps on every save, so a poller can tell whether it already has the latest. */
  version: number;
  updated_at: string | null;
  /** Who saved last — shown to the other managers as "X is editing". */
  updated_by: EmployeeSummary | null;
}

/** Polled while a review is open: the shared draft, and who decided it if someone already did. */
export interface ManagerReviewDraftState {
  submission_id: number;
  review_status: MonthlySubmissionReviewStatus | null;
  draft: ManagerReviewDraft | null;
  decided_by: EmployeeSummary | null;
}

/** Only what this manager just changed; the server merges it per KPI/value. */
export interface ItemComment {
  id: number;
  comment: string;
}

export interface ManagerReviewDraftPatch {
  kpi_ratings: Array<Pick<KpiRating, "kpi_id" | "rating">>;
  value_ratings: ValueRating[];
  /** A comment can be saved before its rating is chosen. */
  kpi_comments?: ItemComment[];
  value_comments?: ItemComment[];
  comments?: string;
}

/** One of the employee's active projects and the managers who will review it. */
export interface ProjectWithManagers {
  project_code: string;
  project_name: string;
  managers: EmployeeSummary[];
}

export interface ManagerReviewSubmitPayload {
  action: "SUBMIT" | "REJECT";
  kpi_ratings: KpiRating[];
  value_ratings: ValueRating[];
  comments: string;
}

export interface AdminReviewSubmitPayload {
  action: "APPROVE" | "REJECT" | "REJECT_MANAGER";
  comments: string;
  tech_showcase?: string | null;
  /** APPROVE only — HR's explicit final score (1–6); omitted = computed. */
  final_score?: number | null;
}

/** RTP performance score: KPI 90% + WebKnot values 10%, plus certification/
 * reward brownie points on top of the weighted KPI component. Matches the
 * legacy Java backend's SubmissionScoreCalculator exactly (see
 * webtrak1.0/app/domain/kpi_score.py). */
export interface ScoreBreakdown {
  normalized_kpi_score: number;
  normalized_values_score: number;
  weighted_kpi_component: number;
  weighted_values_component: number;
  certification_points: number;
  recognition_points: number;
  brownie_points: number;
  total_score: number;
  promotion_eligible: boolean;
  kpi_weight: number;
  values_weight: number;
}

export interface CycleKpiSummary {
  cycle_key: string;
  cycle_label: string;
  submissions: number;
  kpi_average: number | null;
  manager_kpi_average: number | null;
  employee_rating_average: number | null;
  employee_rating_display: string | null;
  manager_rating_average: number | null;
  manager_rating_display: string | null;
  admin_rating_average: number | null;
  admin_rating_display: string | null;
  /** Months of this cycle that have a final score, and their average — the cycle's single six-month result. */
  months_reviewed?: number;
  six_month_result?: number | null;
  promotion_eligible?: boolean;
}

/** One reviewed month, for the year-at-a-glance trend. */
export interface MonthKpiPoint {
  month: string;
  cycle_key: string | null;
  review_status: string | null;
  employee_rating: number | null;
  manager_rating: number | null;
  admin_rating: number | null;
}

export interface AllTimeKpiSummary {
  user_id: number;
  emp_id: string | null;
  employee_name: string;
  employee_email: string;
  date_of_joining: string | null;
  total_submissions: number;
  reviewed_submissions: number;
  all_time_kpi_average: number | null;
  all_time_manager_kpi_average: number | null;
  employee_rating_average: number | null;
  employee_rating_display: string | null;
  manager_rating_average: number | null;
  manager_rating_display: string | null;
  admin_rating_average: number | null;
  admin_rating_display: string | null;
  cycles: CycleKpiSummary[];
  months?: MonthKpiPoint[];
}

// --- Pulse insights (HR/Admin) ---

export interface InsightsMonthPoint {
  month: string;
  submissions: number;
  finalised: number;
  employee_average: number | null;
  manager_average: number | null;
  final_average: number | null;
}

export interface InsightsStats {
  count: number;
  mean: number | null;
  stdev: number | null;
  median: number | null;
  minimum: number | null;
  maximum: number | null;
  p10: number | null;
  p25: number | null;
  p75: number | null;
  p90: number | null;
}

export interface InsightsEmployee {
  user_id: number;
  name: string;
  emp_id: string | null;
  department: string | null;
  months_submitted: number;
  months_finalised: number;
  employee_average: number | null;
  manager_average: number | null;
  six_month_result: number | null;
  percentile: number | null;
  promotion_eligible: boolean;
}

export interface InsightsCycleReport {
  cycle_key: string;
  cycle_label: string;
  months: string[];
  employees_total: number;
  employees_with_result: number;
  promotion_eligible_count: number;
  promotion_min_score: number;
  employee_average: number | null;
  manager_average: number | null;
  final_average: number | null;
  stats: InsightsStats;
  histogram: { lower: number; upper: number; count: number }[];
  bell_curve: { x: number; density: number }[];
  departments: { department: string; employees: number; average: number | null }[];
  employees: InsightsEmployee[];
}

export interface PulseInsights {
  cycle_key: string;
  cycles: { key: string; label: string }[];
  year: InsightsMonthPoint[];
  cycle: InsightsCycleReport;
}

/** HR/Admin-tunable Pulse scoring (Settings → Pulse scoring). Percentages. */
export interface PulseScoreSettingsWrite {
  kpi_weight_percent: number;
  values_weight_percent: number;
  certification_low_rate_percent: number;
  certification_high_rate_percent: number;
  certification_low_max: number;
  recognition_low_rate_percent: number;
  recognition_high_rate_percent: number;
  recognition_low_max: number;
  promotion_min_score: number;
}

export interface PulseScoreSettings extends PulseScoreSettingsWrite {
  /** Highest reachable final score — the cap for HR's manual override. */
  max_score: number;
  is_default: boolean;
  updated_by: string | null;
  updated_at: string | null;
}

export interface AdminMonthlyOverview {
  month: string;
  cycle_key: string;
  six_month_review_month: boolean;
  total_submissions: number;
  manager_reviewed: number;
  approved: number;
  pending_manager_review: number;
}
