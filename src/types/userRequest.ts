export type ApprovalStage = "PENDING" | "APPROVED" | "REJECTED";

/** A person on an approval chain: who a request is waiting on, or who acted on it. */
export interface ApprovalPerson {
  name: string | null;
  email: string | null;
}

/** One decision recorded against a request, oldest first. */
export interface ApprovalHistoryEntry {
  action: "APPROVED" | "REJECTED" | "APPROVED_BY_DEFAULT" | string;
  /** Capacity the person acted in — Manager, HR, Admin or Auto. Display only. */
  actioner_role: string | null;
  actioner_name: string | null;
  actioner_email: string | null;
  message: string | null;
  /** dd/mm/yyyy HH:MM:SS */
  acted_at: string | null;
}

export interface UserRequestOut {
  id: number;
  emp_email: string;
  employee_name?: string | null;
  request_from_date: string;
  request_to_date: string;
  comments: string | null;
  request_type: "LEAVE" | "WFH" | "COMP_OFF" | string;
  status: ApprovalStage;
  manager_status: ApprovalStage | null;
  manager_reason: string | null;
  hr_status: ApprovalStage | null;
  hr_reason: string | null;
  is_half_day: boolean;
  reference_file_url: string | null;
  primary_managers?: string[] | null;
  secondary_managers?: string[] | null;
  approval_history?: ApprovalHistoryEntry[] | null;
  pending_approvers?: ApprovalPerson[] | null;
  created_at: string;
  updated_at: string;
}

export interface UserRequestStatusUpdate {
  userRequestId: number;
  userRequestStatus: ApprovalStage;
  reason?: string;
}

export interface UserRequestListData {
  current_page: number;
  total_pages: number;
  page_size: number;
  total_elements: number;
  data: UserRequestOut[];
}
