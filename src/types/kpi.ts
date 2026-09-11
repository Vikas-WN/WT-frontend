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
