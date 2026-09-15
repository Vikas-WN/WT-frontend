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

export interface ScoreBreakdown {
  kpi_score: number;
  values_score: number;
  certifications_score: number;
  final_score: number;
  kpi_weight: number;
  values_weight: number;
  certifications_weight: number;
}
