import { DASHBOARD_ROUTES } from "@/constants/routes";
import type { NotificationItem } from "@/services/hrms.service";
import { normalizeRoles } from "@/utils/roles";

const COMP_OFF_SELF = "/dashboard/leave?tab=comp-off";
const LEARNING_SCORES = "/dashboard/learning-development";

type NotificationRouteContext = {
  userRoles?: string[];
};

function readNotificationType(row: NotificationItem | Record<string, unknown>): string {
  return String(row.type ?? (row as Record<string, unknown>).notification_type ?? "")
    .trim()
    .toUpperCase();
}

function readNotificationMessage(row: NotificationItem | Record<string, unknown>): string {
  return String(
    (row as NotificationItem).message ?? (row as Record<string, unknown>).message ?? ""
  );
}

function hasAnyRole(roles: string[], candidates: string[]): boolean {
  const normalized = normalizeRoles(roles);
  return candidates.some((role) => normalized.includes(role));
}

function isRequestApprover(roles: string[]): boolean {
  return hasAnyRole(roles, ["ROLE_HR", "ROLE_ADMIN", "ROLE_MANAGER", "ROLE_DM", "ROLE_AM"]);
}

function isHrOrAdmin(roles: string[]): boolean {
  return hasAnyRole(roles, ["ROLE_HR", "ROLE_ADMIN"]);
}

function notificationSenderEmail(
  row: NotificationItem | Record<string, unknown>
): string | null {
  const raw =
    (row as NotificationItem).sender_email ??
    (row as Record<string, unknown>).senderEmail ??
    (row as Record<string, unknown>).sender_email;
  const email = String(raw ?? "").trim().toLowerCase();
  return email || null;
}

function timelogTeamHrefForEmployee(employeeEmail: string | null): string {
  const base = DASHBOARD_ROUTES["timelog-team"];
  if (!employeeEmail) return base;
  return `${base}?employee=${encodeURIComponent(employeeEmail)}`;
}

/** Extract leave/WFH deep-link fields from a notification message. */
export function parseLeaveNotificationDeepLink(message: string): {
  requestId: string | null;
  from: string | null;
  to: string | null;
} {
  const text = String(message ?? "");
  const idMatch = text.match(/request\s*#\s*(\d+)/i);
  const rangeMatch = text.match(
    /from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i
  );
  return {
    requestId: idMatch?.[1] ?? null,
    from: rangeMatch?.[1] ?? null,
    to: rangeMatch?.[2] ?? null,
  };
}

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** Pull a "<Month> <Year>" (e.g. "May 2026") out of free text → 1-based month. */
export function parseMonthYearFromText(
  text: string
): { year: number; month: number } | null {
  const match = String(text ?? "")
    .toLowerCase()
    .match(
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/
    );
  if (!match) return null;
  return { year: Number(match[2]), month: MONTH_NAMES.indexOf(match[1]) + 1 };
}

function withLeaveDeepLink(
  basePath: string,
  row: NotificationItem | Record<string, unknown>,
  tab: string,
  requestType?: string
): string {
  const { requestId, from, to } = parseLeaveNotificationDeepLink(readNotificationMessage(row));
  const params = new URLSearchParams();
  params.set("tab", tab);
  // Prefer request id when present (legacy messages). Otherwise pass dates so the
  // leave page can highlight the matching row without clamping list filters.
  if (requestId) params.set("requestId", requestId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (requestType?.trim()) params.set("requestType", requestType.trim().toUpperCase());
  return `${basePath}?${params.toString()}`;
}

/** Human-readable category for the notification badge. */
export function notificationCategoryLabel(
  row: NotificationItem | Record<string, unknown>
): string {
  const type = readNotificationType(row);
  switch (type) {
    case "LEAVE_REQUEST":
    case "LEAVE_APPROVED":
    case "LEAVE_REJECTED":
    case "LEAVE_APPROVAL_REMINDER":
    case "LEAVE_AUTO_APPROVED":
    case "LOP_LEAVE_REQUEST":
      return "Leave";
    case "WFH_REQUEST":
    case "WFH_APPROVED":
    case "WFH_REJECTED":
      return "WFH";
    case "WFH_EXCEPTION_REQUEST":
    case "WFH_EXCEPTION_APPROVED":
    case "WFH_EXCEPTION_REJECTED":
      return "WFH Exception";
    case "COMP_OFF_REQUEST":
    case "COMP_OFF_APPROVED":
    case "COMP_OFF_REJECTED":
      return "Comp Off";
    case "PROJECT_ASSIGNMENT":
    case "PROJECT_DEALLOCATION":
    case "ALLOCATION_ENDING_REMINDER":
      return "Allocation";
    case "ALLOCATION_EXTENSION_REQUEST":
    case "ALLOCATION_EXTENSION_APPROVED":
    case "ALLOCATION_EXTENSION_REJECTED":
      return "Extend Project Allocation";
    case "TIMELOG_APPROVED":
    case "TIMELOG_REJECTED":
    case "TIMELOG_SUBMITTED":
    case "TIMELOG_REQUEST":
    case "NO_TIME_LOGS":
      return "Time Log";
    case "TRAINING_SCHEDULED":
    case "TRAINING_REMINDER":
    case "TRAINING_WITHDRAWAL_REQUEST":
    case "TRAINING_WITHDRAWAL_APPROVED":
    case "TRAINING_WITHDRAWAL_REJECTED":
    case "TRAINING_ASSESSMENT_ASSIGNED":
      return "Training";
    case "TRAINING_MARKS_PUBLISHED":
      return "Training Scores";
    case "EXIT_INTERVIEW_REMINDER":
    case "EXIT_INTERVIEW_SUBMITTED":
      return "Exit Survey";
    case "ONBOARDING_INVITE":
    case "ONBOARDING_COMPLETED":
    case "ONBOARDING_PROFILE_PENDING":
      return "Onboarding";
    case "IMPORT_JOB_COMPLETED":
      return "Uploads";
    case "POLICY_SENT":
    case "POLICY_VIEWED":
    case "POLICY_SIGNED":
    case "POLICY_PENDING_REMINDER":
      return "Policy";
    case "INTERNSHIP_ABOUT_TO_COMPLETE":
      return "Internship";
    case "ANNOUNCEMENT":
      return "Announcement";
    case "BIRTHDAY_WISH":
      return "Birthday";
    case "EMPLOYEE_ID_UPDATED":
      return "Profile";
    case "LOP_REPORT_READY":
      return "LOP Report";
    default:
      return "—";
  }
}

/** Coarser bucket a notification's fine-grained category rolls up into, so the
 *  bell panel can group ~20 category labels into a handful of sections
 *  instead of a flat chronological list. Order here doubles as display order
 *  — see `NOTIFICATION_GROUP_ORDER`. */
export function notificationGroupLabel(categoryLabel: string): string {
  switch (categoryLabel) {
    case "Leave":
    case "WFH":
    case "WFH Exception":
    case "Comp Off":
      return "Leave & Time Off";
    case "Time Log":
      return "Time Logs";
    case "Allocation":
    case "Extend Project Allocation":
      return "Allocations";
    case "Training":
    case "Training Scores":
      return "Training";
    case "Onboarding":
    case "Exit Survey":
    case "Internship":
    case "Profile":
      return "Employee Lifecycle";
    case "Uploads":
    case "Policy":
    case "LOP Report":
      return "Admin";
    case "Announcement":
    case "Birthday":
      return "Announcements";
    default:
      return "Other";
  }
}

/** Fixed display order for notification groups — keeps the panel's section
 *  order stable regardless of which types happen to be present. Anything not
 *  listed (there shouldn't be anything) sorts last. */
export const NOTIFICATION_GROUP_ORDER = [
  "Leave & Time Off",
  "Time Logs",
  "Allocations",
  "Announcements",
  "Employee Lifecycle",
  "Training",
  "Admin",
  "Other",
];

/** Group notifications by `notificationGroupLabel`, preserving each item's
 *  original relative order within its group, and ordering groups per
 *  `NOTIFICATION_GROUP_ORDER`. */
export function groupNotificationsByCategory<T extends NotificationItem | Record<string, unknown>>(
  rows: T[]
): { label: string; rows: T[] }[] {
  const buckets = new Map<string, T[]>();
  for (const row of rows) {
    const group = notificationGroupLabel(notificationCategoryLabel(row));
    const list = buckets.get(group) ?? [];
    list.push(row);
    buckets.set(group, list);
  }
  return [...buckets.entries()]
    .sort((a, b) => {
      const ai = NOTIFICATION_GROUP_ORDER.indexOf(a[0]);
      const bi = NOTIFICATION_GROUP_ORDER.indexOf(b[0]);
      return (ai === -1 ? NOTIFICATION_GROUP_ORDER.length : ai) -
        (bi === -1 ? NOTIFICATION_GROUP_ORDER.length : bi);
    })
    .map(([label, groupRows]) => ({ label, rows: groupRows }));
}

/** Resolve the dashboard path a notification should open. */
export function resolveNotificationHref(
  row: NotificationItem | Record<string, unknown>,
  context: NotificationRouteContext = {}
): string | null {
  const type = readNotificationType(row);
  const roles = context.userRoles ?? [];

  switch (type) {
    case "LEAVE_REQUEST":
    case "LOP_LEAVE_REQUEST":
    case "LEAVE_APPROVAL_REMINDER":
      return isRequestApprover(roles)
        ? withLeaveDeepLink(DASHBOARD_ROUTES["leave-team"], row, "team")
        : withLeaveDeepLink(DASHBOARD_ROUTES.leave, row, "my");

    case "LEAVE_APPROVED":
    case "LEAVE_REJECTED":
    case "LEAVE_AUTO_APPROVED":
      return withLeaveDeepLink(DASHBOARD_ROUTES.leave, row, "my");

    case "WFH_REQUEST":
    case "WFH_EXCEPTION_REQUEST":
      return isRequestApprover(roles)
        ? withLeaveDeepLink(DASHBOARD_ROUTES["leave-team"], row, "team")
        : withLeaveDeepLink(DASHBOARD_ROUTES.leave, row, "wfh");

    case "WFH_APPROVED":
    case "WFH_REJECTED":
    case "WFH_EXCEPTION_APPROVED":
    case "WFH_EXCEPTION_REJECTED":
      return withLeaveDeepLink(DASHBOARD_ROUTES.leave, row, "wfh");

    case "COMP_OFF_REQUEST":
      return isRequestApprover(roles)
        ? withLeaveDeepLink(DASHBOARD_ROUTES["leave-team"], row, "team", "COMP_OFF_EARN")
        : COMP_OFF_SELF;

    case "COMP_OFF_APPROVED":
    case "COMP_OFF_REJECTED":
      return COMP_OFF_SELF;

    case "PROJECT_ASSIGNMENT":
    case "PROJECT_DEALLOCATION":
    case "ALLOCATION_ENDING_REMINDER":
      return isHrOrAdmin(roles) ? DASHBOARD_ROUTES.allocation : DASHBOARD_ROUTES.profile;

    case "ALLOCATION_EXTENSION_REQUEST":
    case "ALLOCATION_EXTENSION_APPROVED":
    case "ALLOCATION_EXTENSION_REJECTED":
      return DASHBOARD_ROUTES["allocation-extension"];

    case "TIMELOG_SUBMITTED":
    case "TIMELOG_REQUEST":
      // Open Team Time Logs for the employee who submitted (sender).
      return timelogTeamHrefForEmployee(notificationSenderEmail(row));

    case "NO_TIME_LOGS":
    case "TIMELOG_APPROVED":
    case "TIMELOG_REJECTED":
      return DASHBOARD_ROUTES.timelog;

    case "TRAINING_MARKS_PUBLISHED":
      return LEARNING_SCORES;

    case "TRAINING_SCHEDULED":
    case "TRAINING_REMINDER":
    case "TRAINING_WITHDRAWAL_REQUEST":
    case "TRAINING_WITHDRAWAL_APPROVED":
    case "TRAINING_WITHDRAWAL_REJECTED":
    case "TRAINING_ASSESSMENT_ASSIGNED":
      return DASHBOARD_ROUTES.learning;

    case "EXIT_INTERVIEW_REMINDER":
      return DASHBOARD_ROUTES["exit-interview"];

    case "EXIT_INTERVIEW_SUBMITTED":
      return isHrOrAdmin(roles) ? DASHBOARD_ROUTES.offboarding : DASHBOARD_ROUTES["exit-interview"];

    case "ONBOARDING_INVITE":
    case "ONBOARDING_COMPLETED":
    case "ONBOARDING_PROFILE_PENDING":
      return DASHBOARD_ROUTES.employee;

    case "IMPORT_JOB_COMPLETED":
      return DASHBOARD_ROUTES.uploads;

    case "INTERNSHIP_ABOUT_TO_COMPLETE":
      return isHrOrAdmin(roles) ? DASHBOARD_ROUTES.offboarding : DASHBOARD_ROUTES.profile;

    case "POLICY_SENT":
    case "POLICY_VIEWED":
    case "POLICY_SIGNED":
    case "POLICY_PENDING_REMINDER":
      return DASHBOARD_ROUTES.profile;

    case "ANNOUNCEMENT":
      return DASHBOARD_ROUTES.profile;

    case "EMPLOYEE_ID_UPDATED":
      return DASHBOARD_ROUTES.profile;

    case "LOP_REPORT_READY": {
      const base = DASHBOARD_ROUTES["reports-lop"];
      const period = parseMonthYearFromText(readNotificationMessage(row));
      if (!period) return base;
      return `${base}?year=${period.year}&month=${period.month}`;
    }

    default:
      return null;
  }
}

export function notificationType(row: NotificationItem | Record<string, unknown>): string {
  return readNotificationType(row);
}
