export type UtilizationLevel = "over" | "full" | "partial" | "bench" | "none";

export interface UtilizationWeekCell {
  /** dd/mm/yyyy (a Monday) */
  week_start: string;
  planned_percent: number;
  /** null when the person was on leave all week */
  actual_percent: number | null;
  logged_hours: number;
  leave_days: number;
  level: UtilizationLevel;
}

export interface UtilizationPerson {
  emp_id: string | null;
  name: string;
  email: string;
  department: string;
  weeks: UtilizationWeekCell[];
  average_planned: number;
}

export interface UtilizationTeamWeek {
  week_start: string;
  average_planned: number;
  over: number;
  full: number;
  partial: number;
  bench: number;
}

export interface UtilizationTeam {
  department: string;
  head_count: number;
  average_planned: number;
  weeks: UtilizationTeamWeek[];
}

export interface WeeklyUtilization {
  weeks: string[];
  people: UtilizationPerson[];
  teams: UtilizationTeam[];
  departments: string[];
  thresholds: { over_above: number; full_from: number; partial_from: number };
}

export interface WeeklyUtilizationQuery {
  /** dd/mm/yyyy */
  start?: string;
  weeks?: number;
  department?: string;
  search?: string;
}
