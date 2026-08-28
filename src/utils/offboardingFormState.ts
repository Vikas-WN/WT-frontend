import { isValidApiDate, parseApiDate } from "@/utils/apiDate";
import { normalizeDirectoryUserType } from "@/utils/userTypeTransition";

export type ExitType = "VOLUNTARY" | "INVOLUNTARY" | "CONTRACTUAL";

export const CONSULTANT_EXIT_TYPE: ExitType = "CONTRACTUAL";

/** Default notice period for FTE/consultant offboarding (calendar days after resignation). */
export const DEFAULT_NOTICE_PERIOD_DAYS = 60;

export const EXIT_TYPE_OPTIONS: Array<{ value: ExitType; label: string }> = [
  { value: "VOLUNTARY", label: "Voluntary" },
  { value: "INVOLUNTARY", label: "Involuntary" },
  { value: "CONTRACTUAL", label: "Contractual" },
];

/** Alias used by older offboarding panel imports. */
export const EXIT_TYPE_SELECT_OPTIONS = EXIT_TYPE_OPTIONS;

export type OffboardingFormState = {
  emp_id: string;
  resignation_date: string;
  last_working_day: string;
  exit_type: "" | ExitType;
  reason: string;
  critical_skill: string;
  expected_behavior: string;
  is_regretted: boolean;
};

export function createEmptyOffboardingForm(): OffboardingFormState {
  return {
    emp_id: "",
    resignation_date: "",
    last_working_day: "",
    exit_type: "",
    reason: "",
    critical_skill: "",
    expected_behavior: "",
    is_regretted: false,
  };
}

/** Add calendar days to a date input (`yyyy-mm-dd`) or API date string. */
export function addDaysToDateInput(value: string, days: number): string {
  const parsed = parseApiDate(value);
  if (!parsed || days < 0) return "";
  const next = new Date(parsed);
  next.setDate(next.getDate() + days);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, "0");
  const d = String(next.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * If the given date (yyyy-mm-dd) falls on a weekend (Saturday/Sunday),
 * return the previous Friday. Otherwise return the date unchanged.
 */
export function previousWeekdayOrSame(value: string): string {
  const parsed = parseApiDate(value);
  if (!parsed) return value;
  const day = parsed.getDay();
  if (day === 0) {
    // Sunday → go back 2 days to Friday
    const fri = new Date(parsed);
    fri.setDate(fri.getDate() - 2);
    const y = fri.getFullYear();
    const m = String(fri.getMonth() + 1).padStart(2, "0");
    const d = String(fri.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (day === 6) {
    // Saturday → go back 1 day to Friday
    const fri = new Date(parsed);
    fri.setDate(fri.getDate() - 1);
    const y = fri.getFullYear();
    const m = String(fri.getMonth() + 1).padStart(2, "0");
    const d = String(fri.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return value;
}

export function defaultLastWorkingDayFromResignation(resignationDate: string): string {
  const trimmed = resignationDate.trim();
  if (!trimmed) return "";
  const raw = addDaysToDateInput(trimmed, DEFAULT_NOTICE_PERIOD_DAYS);
  return previousWeekdayOrSame(raw);
}

/** Read exit type from API rows (offboard / exit-interview; legacy separation_type supported). */
export function readExitType(row: Record<string, unknown> | null | undefined): string {
  if (!row) return "";
  const value =
    row.exit_type ??
    row.exitType ??
    row.separation_type ??
    row.separationType ??
    "";
  return String(value).trim();
}

export function formatExitTypeLabel(value: string): string {
  const v = String(value ?? "").trim().toUpperCase();
  const match = EXIT_TYPE_OPTIONS.find((opt) => opt.value === v);
  return match?.label ?? (v || "—");
}

export function formatUserTypeLabel(value: string): string {
  const v = String(value ?? "").trim().toUpperCase();
  if (v === "FULLTIME") return "Full-Time";
  if (v === "INTERN") return "Intern";
  if (v === "CONSULTANT") return "Consultant";
  if (v === "HR") return "HR";
  return v || "—";
}

/** Consultant / contractual exits have LWD only — no separate resignation or notice period. */
export function isLwdOnlyOffboarding(opts: {
  userType?: string | null;
  exitType?: string | null;
}): boolean {
  const userType = normalizeDirectoryUserType(opts.userType);
  const exitType = String(opts.exitType ?? "")
    .trim()
    .toUpperCase();
  return userType === "CONSULTANT" || exitType === "CONTRACTUAL";
}

/** Inclusive notice days from resignation through LWD, or null when not applicable. */
export function calculateNoticePeriodDays(
  resignationDate: string | null | undefined,
  lastWorkingDay: string | null | undefined
): number | null {
  const resignation = parseApiDate(String(resignationDate ?? "").trim());
  const lwd = parseApiDate(String(lastWorkingDay ?? "").trim());
  if (!resignation || !lwd || lwd < resignation) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((lwd.getTime() - resignation.getTime()) / msPerDay) + 1;
}

export function isOffboardingFormValid(
  form: OffboardingFormState,
  userType: string
): boolean {
  const normalizedType = normalizeDirectoryUserType(userType);
  if (!form.emp_id.trim()) return false;
  if (!form.reason.trim() || !form.critical_skill.trim()) return false;
  if (normalizedType === "INTERN") {
    const lwd = form.last_working_day.trim();
    return Boolean(
      lwd &&
        isValidApiDate(lwd) &&
        form.resignation_date.trim() === lwd &&
        isValidApiDate(form.resignation_date)
    );
  }
  if (normalizedType === "CONSULTANT") {
    // Consultant: LWD only — resignation date / exit-type picker must not be required
    return isValidApiDate(form.last_working_day);
  }
  if (!isValidApiDate(form.resignation_date) || !isValidApiDate(form.last_working_day)) {
    return false;
  }
  return Boolean(form.exit_type);
}
