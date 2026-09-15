export interface MyLearningSummary {
  enrolled_count: number;
  completed_count: number;
  in_progress_count: number;
  overdue_mandatory_count: number;
  avg_score: number | null;
  next_deadline: string | null;
  next_deadline_training_name: string | null;
}

export interface TeamTrainingCompletionRow {
  user_id: number;
  name: string;
  emp_id: string | null;
  training_id: number;
  training_name: string;
  is_mandatory: boolean;
  completion_deadline: string | null;
  enrollment_status: string | null;
  progress_percent: number;
  is_overdue: boolean;
}

export interface CertificateOut {
  training_id: number;
  training_name: string;
  category: string;
  recipient_name: string;
  recipient_emp_id: string | null;
  completed_at: string;
  final_score: number | null;
  issued_at: string;
}
