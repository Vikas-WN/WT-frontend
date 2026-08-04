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

function withLeaveDeepLink(
  basePath: string,
  row: NotificationItem | Record<string, unknown>,
  tab: string
): string {
  const { requestId, from, to } = parseLeaveNotificationDeepLink(readNotificationMessage(row));
  const params = new URLSearchParams();
  params.set("tab", tab);
  // Prefer request id when present (legacy messages). Otherwise pass dates so the
  // leave page can highlight the matching row without clamping list filters.
  if (requestId) params.set("requestId", requestId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
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
    default:
      return "—";
  }
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
      return isRequestApprover(roles) ? DASHBOARD_ROUTES["leave-team"] : COMP_OFF_SELF;

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

    default:
      return null;
  }
}

export function notificationType(row: NotificationItem | Record<string, unknown>): string {
  return readNotificationType(row);
}
