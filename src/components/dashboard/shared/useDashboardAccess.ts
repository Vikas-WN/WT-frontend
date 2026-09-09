"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useSelfProfile, selfProfileQueryKey } from "@/hooks/useSelfProfile";
import { hasDmRole, hasManagerRole } from "@/utils/roles";
import {
  isOffboardedUserStatus,
  isServingNoticeUserStatus,
  normalizeUserStatus,
  resolveProfileStatus,
  shouldRequireSelfOnboarding,
  shouldRequireSelfOnboardingForUser,
  shouldShowExitSurveyForStatus,
} from "@/utils/userStatus";
import { isPortalLockedProfile } from "@/utils/portalLock";

export function useDashboardAccess() {
  const queryClient = useQueryClient();
  const { user, refresh: refreshSession } = useAuth();
  const userRoles = user?.roles ?? [];
  const hasHrAccess = userRoles.includes("ROLE_HR") || userRoles.includes("ROLE_ADMIN");
  const hasManagerAccess = hasManagerRole(userRoles);
  const hasDmAccess = hasDmRole(userRoles);
  const hasAccountManagerAccess = userRoles.includes("ROLE_AM");
  const isEmployee = userRoles.includes("ROLE_EMPLOYEE");
  const isAccountManagerOnly =
    hasAccountManagerAccess && !hasHrAccess && !hasManagerAccess;
  const initialStatus = normalizeUserStatus(user?.status);
  const [profileStatus, setProfileStatus] = useState(initialStatus);
  /**
   * True once `profileStatus` came from the employee's actual profile record
   * rather than from the session.
   *
   * `user.status` is a claim minted when the session was issued. For anyone who
   * signed in before completing onboarding it keeps saying INVITED / ONBOARDING
   * for the life of that session, and GET /profile soft-fails to `null` on a
   * 403/404/500/502/503/504/timeout (see fetchSelfProfile) — at which point this
   * hook used to fall straight back to that stale claim. An ACTIVE employee then
   * got "Onboarding Pending" and was pushed back into the onboarding form
   * (BUG_ID_319 / BUG_ID_313), intermittently, which is exactly why it survived
   * a fix that only changed *which* flag the dashboard guard reads.
   *
   * So the session status is no longer allowed to *assert* that onboarding is
   * outstanding — only the live profile is. Withholding the gate is the safe
   * direction: the worst case is a genuinely invited user briefly seeing the
   * dashboard (the backend still refuses their writes), whereas the other
   * direction locks working employees out of the whole app.
   */
  const [statusFromProfile, setStatusFromProfile] = useState(false);
  const [isSelfOnboarded, setIsSelfOnboarded] = useState(
    () => !shouldRequireSelfOnboarding(initialStatus)
  );
  const profileQ = useSelfProfile(Boolean(user));
  /** Employment ended — applies regardless of manager/AM roles on the account. */
  const isOffboarded = isOffboardedUserStatus(profileStatus);
  const isServingNotice = isServingNoticeUserStatus(profileStatus);
  const isPortalLocked = isPortalLockedProfile(profileQ.data ?? null);
  // Staff-portal users (HR / Admin / Manager / DM / AM / Finance) are never put
  // into the employee self-onboarding flow, even if their record carries a
  // non-ACTIVE / legacy status.
  const requiresSelfOnboarding =
    statusFromProfile && shouldRequireSelfOnboardingForUser(profileStatus, userRoles);
  const requiresExitSurvey = shouldShowExitSurveyForStatus(profileStatus, userRoles);
  const isExitSurveyOnlyAccess = requiresExitSurvey;
  // Own Profile self-edit: employees and HR/Admin personas (HR was previously excluded).
  const employeeSelfServeProfile = isEmployee || hasHrAccess;
  const canAccessProfile = Boolean(user);
  const canAccessOverview = useMemo(
    () =>
      userRoles.includes("ROLE_HR") ||
      userRoles.includes("ROLE_ADMIN") ||
      userRoles.includes("ROLE_FINANCE"),
    [userRoles]
  );

  useEffect(() => {
    if (!user) return;
    if (profileQ.isLoading) return;

    const profile = profileQ.data ?? null;
    if (!profile) {
      // No live record to read (soft-failed request, or a portal role that has
      // no /profile endpoint). Keep the session status for display purposes but
      // do NOT treat it as authoritative — see `statusFromProfile`.
      const status = normalizeUserStatus(user?.status);
      setProfileStatus(status);
      setStatusFromProfile(false);
      setIsSelfOnboarded(true);
      return;
    }

    const status = resolveProfileStatus(profile, user);
    setProfileStatus(status);
    setStatusFromProfile(true);
    setIsSelfOnboarded(!shouldRequireSelfOnboarding(status));
    // Do NOT call refreshSession() here — status sync must not rotate refresh tokens.
    // Profile status is already authoritative for dashboard gating.
  }, [user, profileQ.data, profileQ.isLoading, userRoles]);

  const loadMyProfile = useCallback(async () => {
    const result = await profileQ.refetch();
    const profile = result.data ?? null;
    if (!profile) {
      const status = normalizeUserStatus(user?.status);
      setProfileStatus(status);
      setStatusFromProfile(false);
      setIsSelfOnboarded(true);
      return null;
    }
    const status = resolveProfileStatus(profile, user);
    setProfileStatus(status);
    setStatusFromProfile(true);
    setIsSelfOnboarded(!shouldRequireSelfOnboarding(status));
    // Avoid rotating refresh tokens just to sync a stale auth.status string.
    void queryClient.invalidateQueries({ queryKey: ["profile", "exit-interview"] });
    return profile;
  }, [profileQ, queryClient, user, userRoles]);

  const invalidateSelfProfile = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: selfProfileQueryKey(user?.email) });
  }, [queryClient, user?.email]);

  return {
    user,
    refreshSession,
    userRoles,
    hasHrAccess,
    hasManagerAccess,
    hasDmAccess,
    hasAccountManagerAccess,
    isAccountManagerOnly,
    isEmployee,
    requiresSelfOnboarding,
    requiresExitSurvey,
    employeeSelfServeProfile,
    canAccessProfile,
    canAccessOverview,
    isSelfOnboarded,
    setIsSelfOnboarded,
    loadMyProfile,
    invalidateSelfProfile,
    profileStatus,
    isOffboarded,
    isServingNotice,
    /** @deprecated Use isServingNotice */
    isInNotice: isServingNotice,
    isPortalLocked,
    isExitSurveyOnlyAccess,
    profile: profileQ.data ?? null,
    profileLoading: profileQ.isLoading,
  };
}
