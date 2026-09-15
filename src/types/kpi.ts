export interface KpiDefinitionItem {
  id: number;
  band_id: number;
  department: string;
  designation: string;
  kpi_name: string;
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
  evaluation_criteria: string | null;
  weightage: number;
  active: boolean;
}

export type SubmissionCycleScope = "GLOBAL" | "EMPLOYEE" | "MANAGER";

export interface SubmissionCycleItem {
  id: number;
  cycle_key: string;
  scope: SubmissionCycleScope;
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
  window_start_at: string;
  window_end_at: string | null;
  manual_closed: boolean;
}

export interface SubmissionWindowStatus {
  scope: string;
  cycle_key: string;
  open: boolean;
  resolved_scope: string | null;
}

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
  manager_evaluation: ManagerEvaluation | null;
  manager_review: ReviewDecision | null;
  admin_review: AdminReviewDecision | null;
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
