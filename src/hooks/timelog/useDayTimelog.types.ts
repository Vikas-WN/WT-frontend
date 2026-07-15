export type DayTimelogEntry = {
  id: number;
  employee_email: string;
  project_code: string;
  project_name?: string | null;
  project_manager?: string | null;
  primary_manager_emails?: string[] | null;
  primaryManagerEmails?: string[] | null;
  log_date: string;
  hours: number;
  task_category: string;
  sub_category: string | null;
  description: string | null;
  status: string;
  manager_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DayTimelogEntryForm = {
  project_code: string;
  project_name: string;
  project_manager: string;
  task_category: string;
  sub_category: string;
  description: string;
  hours: string;
};

export type DayEntriesMap = Record<string, DayTimelogEntry[]>;

export type CalendarDayInfo = {
  date: Date;
  dateKey: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  /** Hours from submitted/approved/rejected entries only (drafts excluded). */
  totalHours: number;
  /** Count of submitted/approved/rejected entries only (drafts excluded). */
  entryCount: number;
  /** Count of draft entries, surfaced separately so they are not shown as logged entries. */
  draftCount: number;
};

export type CalendarMonth = {
  year: number;
  month: number;
  days: CalendarDayInfo[];
};
