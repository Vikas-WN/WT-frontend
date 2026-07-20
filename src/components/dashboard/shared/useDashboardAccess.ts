"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useSelfProfile, selfProfileQueryKey } from "@/hooks/useSelfProfile";
import { hasDmRole, hasManagerRole, normalizeRoleName } from "@/utils/roles";
import {
  isOffboardedUserStatus,
  isServingNoticeUserStatus,
  normalizeUserStatus,
  resolveProfileStatus,
  shouldRequireSelfOnboarding,
  shouldShowExitSurveyForStatus,
} from "@/utils/userStatus";
import { isPortalLockedProfile } from "@/utils/portalLock";

const STAFF_PORTAL_ROLES = new Set([
  "ROLE_MANAGER",
  "ROLE_DM",
  "ROLE_HR",
  "ROLE_ADMIN",
  "ROLE_AM",
  "ROLE_FINANCE",
]);

function hasStaffPortalRole(roles: string[]): boolean {
  return roles.some((role) => STAFF_PORTAL_ROLES.has(normalizeRoleName(role)));
}

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
  const restrictForPendingOnboarding =
    isEmployee && !hasStaffPortalRole(userRoles);
  const initialStatus = normalizeUserStatus(user?.status);
  const [profileStatus, setProfileStatus] = useState(initialStatus);
  const [isSelfOnboarded, setIsSelfOnboarded] = useState(
    () => !shouldRequireSelfOnboarding(initialStatus, userRoles)
  );
  const profileQ = useSelfProfile(Boolean(user));
  /** Employment ended — applies regardless of manager/AM roles on the account. */
  const isOffboarded = isOffboardedUserStatus(profileStatus);
  const isServingNotice = isServingNoticeUserStatus(profileStatus);
  const isPortalLocked = isPortalLockedProfile(profileQ.data ?? null);
  const requiresSelfOnboarding = shouldRequireSelfOnboarding(profileStatus, userRoles);
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
      const status = normalizeUserStatus(user?.status);
      setProfileStatus(status);
      setIsSelfOnboarded(!shouldRequireSelfOnboarding(status, userRoles));
      return;
    }

    const status = resolveProfileStatus(profile, user);
    setProfileStatus(status);
    setIsSelfOnboarded(!shouldRequireSelfOnboarding(status, userRoles));
    if (normalizeUserStatus(user.status) !== status) {
      void refreshSession();
    }
  }, [user, profileQ.data, profileQ.isLoading, refreshSession, userRoles]);

  const loadMyProfile = useCallback(async () => {
    const result = await profileQ.refetch();
    const profile = result.data ?? null;
    if (!profile) {
      const status = normalizeUserStatus(user?.status);
      setProfileStatus(status);
      setIsSelfOnboarded(!shouldRequireSelfOnboarding(status, userRoles));
      return null;
    }
    const status = resolveProfileStatus(profile, user);
    setProfileStatus(status);
    setIsSelfOnboarded(!shouldRequireSelfOnboarding(status, userRoles));
    if (user && normalizeUserStatus(user.status) !== status) {
      void refreshSession();
    }
    void queryClient.invalidateQueries({ queryKey: ["profile", "exit-interview"] });
    return profile;
  }, [profileQ, queryClient, refreshSession, user, userRoles]);

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
