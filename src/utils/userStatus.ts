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

  if (compact === "ONBOARDING") return "INVITED";
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

export function isActiveUserStatus(status: unknown): boolean {
  return normalizeEmployeeStatusKey(status) === "ACTIVE";
}

export function isOffboardedUserStatus(status: unknown): boolean {
  return normalizeEmployeeStatusKey(status) === "INACTIVE";
}

export function isServingNoticeUserStatus(status: unknown): boolean {
  return normalizeEmployeeStatusKey(status) === "SERVING_NOTICE";
}

/** Active or invited employees eligible for HR offboarding. */
export function isEligibleOffboardCandidateStatus(status: unknown): boolean {
  const key = normalizeEmployeeStatusKey(status);
  return key === "ACTIVE" || key === "INVITED";
}

/** Employees who were invited but never joined the active workforce. */
export function isPreActiveEmployeeStatus(status: unknown): boolean {
  const key = normalizeEmployeeStatusKey(status);
  return key === "INVITED" || key === "ONBOARDING";
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

/**
 * Merge session and profile employment status.
 * Offboarding states from profile win over a stale ACTIVE session token.
 */
export function resolveEffectiveEmployeeStatus(
  sessionStatus: unknown,
  profileStatus: unknown
): string {
  const session = normalizeEmployeeStatusKey(sessionStatus);
  const profile = normalizeEmployeeStatusKey(profileStatus);

  if (profile === "INACTIVE" || profile === "SERVING_NOTICE") return profile;
  if (session === "INACTIVE" || session === "SERVING_NOTICE") return session;

  if (profile === "ACTIVE" || session === "ACTIVE") return "ACTIVE";

  if (profile) return profile;
  return session;
}

/** Refresh JWT when profile reflects a lifecycle change the session has not caught up to. */
export function shouldRefreshSessionForProfileStatus(
  sessionStatus: unknown,
  profileStatus: unknown
): boolean {
  const session = normalizeEmployeeStatusKey(sessionStatus);
  const profile = normalizeEmployeeStatusKey(profileStatus);
  if (!session || !profile || session === profile) return false;

  if (profile === "SERVING_NOTICE" || profile === "INACTIVE") return true;
  if (profile === "ACTIVE" && isPreActiveEmployeeStatus(session)) return true;
  return false;
}

function profileFlagIsTrue(profile: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    if (profile[key] === true) return true;
  }
  return false;
}

function profileFlagIsFalse(profile: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    if (profile[key] === false) return true;
  }
  return false;
}

/** Whether a self-serve employee should see the onboarding form (not exit survey / notice). */
export function requiresSelfOnboardingForEmployee(params: {
  restrictForPendingOnboarding: boolean;
  profile: Record<string, unknown> | null | undefined;
  user?: { status?: string } | null;
}): boolean {
  const { restrictForPendingOnboarding, profile, user } = params;
  if (!restrictForPendingOnboarding) return false;

  const profileStatus = resolveProfileStatus(profile, user);
  const effectiveStatus = resolveEffectiveEmployeeStatus(user?.status, profileStatus);

  if (isActiveUserStatus(effectiveStatus)) return false;
  if (isOffboardedUserStatus(effectiveStatus) || isServingNoticeUserStatus(effectiveStatus)) {
    return false;
  }

  if (profile) {
    if (profileFlagIsTrue(profile, "exit_interview_applicable", "exitInterviewApplicable")) {
      return false;
    }
    if (profileFlagIsFalse(profile, "can_complete_onboarding", "canCompleteOnboarding")) {
      return false;
    }
  }

  return isPreActiveEmployeeStatus(effectiveStatus);
}
