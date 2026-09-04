export type EmployeeStatusTone =
  | "active"
  | "inactive"
  | "invited"
  | "serving_notice"
  | "neutral";

export function normalizeUserStatus(status: unknown): string {
  return String(status ?? "").trim().toUpperCase();
}

/** Canonical employee status key for badge styling (handles spaces, hyphens, underscores). */
export function normalizeEmployeeStatusKey(status: unknown): string {
  const compact = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (compact === "ONBOARDING" || compact === "PENDING") return "INVITED";
  if (compact === "OFFBOARDED") return "INACTIVE";
  if (
    compact === "IN_NOTICE" ||
    compact === "INNOTICE" ||
    compact === "SERVING_NOTICE" ||
    compact === "SERVINGNOTICE" ||
    compact === "NOTICE"
  ) {
    return "SERVING_NOTICE";
  }

  return compact;
}

export function formatEmployeeStatusLabel(status: unknown): string {
  const key = normalizeEmployeeStatusKey(status);
  switch (key) {
    case "ACTIVE":
      return "Active";
    case "INACTIVE":
      return "Inactive";
    case "INVITED":
      return "Invited";
    case "SERVING_NOTICE":
      return "Serving Notice";
    case "PENDING":
      return "Pending";
    default: {
      if (!key) return "—";
      return key
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }
  }
}

export function getEmployeeStatusTone(status: unknown): EmployeeStatusTone {
  const key = normalizeEmployeeStatusKey(status);
  if (key === "ACTIVE") return "active";
  if (key === "INACTIVE") return "inactive";
  if (key === "INVITED") return "invited";
  if (key === "SERVING_NOTICE") return "serving_notice";
  return "neutral";
}

export function getEmployeeStatusBadgeClassName(status: unknown): string {
  const tone = getEmployeeStatusTone(status);
  return `wt-status-badge wt-status-badge--${tone.replace("_", "-")}`;
}

/** Employees who have not yet completed onboarding (Invited / legacy Onboarding). */
export function isPreActiveEmployeeStatus(status: unknown): boolean {
  return normalizeEmployeeStatusKey(status) === "INVITED";
}

export function isActiveUserStatus(status: unknown): boolean {
  return normalizeEmployeeStatusKey(status) === "ACTIVE";
}

/** Employees who completed onboarding and may be assigned to client projects. */
export function isEligibleForProjectAllocation(status: unknown): boolean {
  const key = normalizeEmployeeStatusKey(status);
  return key === "ACTIVE" || key === "SERVING_NOTICE";
}

export function isOffboardedUserStatus(status: unknown): boolean {
  return normalizeEmployeeStatusKey(status) === "INACTIVE";
}

export function isServingNoticeUserStatus(status: unknown): boolean {
  return normalizeEmployeeStatusKey(status) === "SERVING_NOTICE";
}

/**
 * Statuses that mean the employee is exiting. Both require a captured Last Working Day
 * (and a Resignation Date for full-time employees) before the profile can be saved.
 */
export function isExitUserStatus(status: unknown): boolean {
  const key = normalizeEmployeeStatusKey(status);
  return key === "SERVING_NOTICE" || key === "INACTIVE";
}

/** Roles that skip employee-only self-service flows (onboarding, exit survey). */
const STAFF_PORTAL_ROLES = new Set([
  "ROLE_MANAGER",
  "ROLE_DM",
  "ROLE_HR",
  "ROLE_ADMIN",
  "ROLE_AM",
  "ROLE_FINANCE",
]);

export function hasStaffPortalRole(roles: string[] | undefined | null): boolean {
  return (roles ?? []).some((role) => STAFF_PORTAL_ROLES.has(normalizeRoleName(role)));
}

function normalizeRoleName(role: string): string {
  const token = role.trim().toUpperCase();
  if (!token) return token;
  return token.startsWith("ROLE_") ? token : `ROLE_${token}`;
}

/** Employee self-service onboarding — INVITED/ONBOARDING only; not ACTIVE, offboarded, or serving notice. */
export function shouldRequireSelfOnboarding(status: unknown): boolean {
  const statusKey = normalizeEmployeeStatusKey(status);
  if (statusKey === "INACTIVE" || statusKey === "SERVING_NOTICE") return false;
  return statusKey !== "ACTIVE";
}

/**
 * Role-aware gate for the self-onboarding redirect. Staff-portal users
 * (HR / Admin / Manager / DM / AM / Finance) are never pushed into the
 * employee self-onboarding flow, regardless of the status on their record —
 * otherwise a missing/legacy status value traps them on /dashboard/profile.
 */
export function shouldRequireSelfOnboardingForUser(
  status: unknown,
  roles: string[] | undefined | null
): boolean {
  const list = roles ?? [];
  // A real employee (ROLE_EMPLOYEE) whose record is explicitly INVITED / ONBOARDING
  // has not completed onboarding and must be routed into it — even if the account
  // also carries a staff role. Only the blanket "unknown / legacy status" case
  // below defers to the staff-portal exemption.
  const isEmployee = list.some(
    (role) => normalizeRoleName(role) === "ROLE_EMPLOYEE"
  );
  if (isEmployee && isPreActiveEmployeeStatus(status)) return true;
  if (hasStaffPortalRole(list)) return false;
  return shouldRequireSelfOnboarding(status);
}

/** Exit survey form — employee self-serve while serving notice only. */
export function shouldShowExitSurveyForStatus(
  status: unknown,
  roles: string[] | undefined
): boolean {
  const userRoles = roles ?? [];
  const isEmployee = userRoles.includes("ROLE_EMPLOYEE");
  const hasStaffAccess = hasStaffPortalRole(userRoles);
  const employeeSelfServe = isEmployee && !hasStaffAccess;

  return employeeSelfServe && isServingNoticeUserStatus(status);
}

/**
 * Employees eligible for HR offboarding: active, or not-yet-active (invited /
 * mid-onboarding). "ONBOARDING" normalizes to "INVITED"; "PENDING" is a legacy
 * directory alias for the same pre-active state.
 */
export function isEligibleOffboardCandidateStatus(status: unknown): boolean {
  const key = normalizeEmployeeStatusKey(status);
  return key === "ACTIVE" || key === "INVITED" || key === "PENDING";
}

/** @deprecated Use isServingNoticeUserStatus */
export function isInNoticeUserStatus(status: unknown): boolean {
  return isServingNoticeUserStatus(status);
}

/** Status from GET /profile (or session user). */
export function resolveProfileStatus(
  profile: Record<string, unknown> | null | undefined,
  user?: { status?: string } | null
): string {
  return normalizeUserStatus(profile?.status ?? profile?.user_status ?? user?.status);
}
