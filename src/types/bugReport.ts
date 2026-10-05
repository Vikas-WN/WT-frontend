export type BugSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type BugStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "WONT_FIX";

export interface BugReporter {
  emp_id: string | null;
  name: string;
  email: string;
}

export interface BugReport {
  id: number;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  page_url: string | null;
  user_agent: string | null;
  resolution_note: string | null;
  reporter: BugReporter;
  handled_by_name: string | null;
  /** dd/mm/yyyy HH:MM:SS */
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BugReportList {
  total: number;
  items: BugReport[];
}

export interface BugReportCreatePayload {
  title: string;
  description: string;
  severity: BugSeverity;
  page_url?: string | null;
  user_agent?: string | null;
}

/** HR/Admin triage. `resolution_note: null` clears the note. */
export interface BugReportUpdatePayload {
  status?: BugStatus;
  resolution_note?: string | null;
}

export interface BugReportListQuery {
  status?: BugStatus;
  severity?: BugSeverity;
  page?: number;
  size?: number;
}
