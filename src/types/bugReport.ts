export type BugSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type BugStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "WONT_FIX";

export interface BugReporter {
  emp_id: string | null;
  name: string;
  email: string;
}

export interface BugAttachment {
  id: number;
  file_name: string;
  content_type: string | null;
  size_bytes: number;
  /** The `s3://` reference — open it through `storedDocumentHref`. */
  file_url: string;
  created_at: string;
}

export interface BugReport {
  id: number;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  page_url: string | null;
  user_agent: string | null;
  /** dd/mm/yyyy HH:MM:SS — when the reporter says it happened. */
  occurred_at: string | null;
  /** What the browser captured (see BugContext); shape can vary by app release. */
  context: Record<string, unknown> | null;
  attachments: BugAttachment[];
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
  /** ISO time from the reporter's device. */
  occurred_at?: string | null;
  context?: object | null;
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
