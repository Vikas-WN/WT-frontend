import { DASHBOARD_ROUTES } from "@/constants/routes";
import type { NotificationItem } from "@/services/hrms.service";
import { normalizeRoles } from "@/utils/roles";

const COMP_OFF_TEAM = "/dashboard/comp-off/team";
const COMP_OFF_SELF = "/dashboard/comp-off";
const LEARNING_SCORES = "/dashboard/learning-development/scores";

type NotificationRouteContext = {
  userRoles?: string[];
};

function readNotificationType(row: NotificationItem | Record<string, unknown>): string {
  return String(row.type ?? (row as Record<string, unknown>).notification_type ?? "")
    .trim()
    .toUpperCase();
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
      return "Allocation Extension";
    case "TIMELOG_APPROVED":
    case "TIMELOG_REJECTED":
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
      return isRequestApprover(roles) ? DASHBOARD_ROUTES["leave-team"] : DASHBOARD_ROUTES.leave;

    case "LEAVE_APPROVED":
    case "LEAVE_REJECTED":
    case "LEAVE_AUTO_APPROVED":
      return DASHBOARD_ROUTES.leave;

    case "WFH_REQUEST":
    case "WFH_EXCEPTION_REQUEST":
      return isRequestApprover(roles) ? DASHBOARD_ROUTES["leave-team"] : DASHBOARD_ROUTES.leave;

    case "WFH_APPROVED":
    case "WFH_REJECTED":
    case "WFH_EXCEPTION_APPROVED":
    case "WFH_EXCEPTION_REJECTED":
      return DASHBOARD_ROUTES.leave;

    case "COMP_OFF_REQUEST":
      return isRequestApprover(roles) ? COMP_OFF_TEAM : COMP_OFF_SELF;

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

    case "NO_TIME_LOGS":
    case "TIMELOG_APPROVED":
    case "TIMELOG_REJECTED":
      return hasAnyRole(roles, ["ROLE_MANAGER", "ROLE_HR", "ROLE_ADMIN"])
        ? DASHBOARD_ROUTES["timelog-team"]
        : DASHBOARD_ROUTES.timelog;

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
      return DASHBOARD_ROUTES.overview;

    default:
      return null;
  }
}

export function notificationType(row: NotificationItem | Record<string, unknown>): string {
  return readNotificationType(row);
}
