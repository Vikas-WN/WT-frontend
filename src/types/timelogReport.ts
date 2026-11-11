/** What the export dialog can filter on. The server has already limited all of it to the signed-in person's scope. */
export type TimelogReportStatus = "SUBMITTED" | "APPROVED" | "REJECTED";

export interface TimelogReportProject {
  code: string;
  name: string;
  /** Emails of the project's Project Manager(s). */
  managers: string[];
  /** Emails of the people allocated now. */
  people: string[];
}

export interface TimelogReportPerson {
  email: string;
  name: string;
  emp_id: string;
  project_codes: string[];
}

export interface TimelogReportOptions {
  scope_label: string;
  can_filter_by_manager: boolean;
  projects: TimelogReportProject[];
  managers: Array<{ email: string; name: string }>;
  people: TimelogReportPerson[];
  statuses: Array<{ value: TimelogReportStatus; label: string }>;
}

export interface TimelogReportRequest {
  year: number;
  /** 1–12 */
  month: number;
  projects: string[];
  managers: string[];
  people: string[];
  statuses: TimelogReportStatus[];
  includeEntries: boolean;
}
