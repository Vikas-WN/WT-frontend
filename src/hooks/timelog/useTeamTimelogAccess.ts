"use client";

import { useAuth } from "@/context/AuthContext";
import { normalizeRoles } from "@/utils/roles";

export const TEAM_TIMELOG_ACCESS_QUERY_KEY = ["timelog", "team-access"] as const;

const TEAM_TIMELOG_ROLES = new Set(["ROLE_MANAGER", "ROLE_HR", "ROLE_ADMIN"]);

/**
 * Managers, HR, and Admin may open team / project time-log views.
 * Pure employees (and AM-only users) may not — including when ROLE_EMPLOYEE
 * is combined with other non-team roles.
 */
export function canViewTeamTimelogsByRole(roles: string[]): boolean {
  const normalized = normalizeRoles(roles);
  return normalized.some((role) => TEAM_TIMELOG_ROLES.has(role));
}

/** Whether the signed-in user may open team / project time-log views. */
export function useTeamTimelogAccess() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const canViewTeamTimelogs = canViewTeamTimelogsByRole(roles);

  return {
    canViewTeamTimelogs,
    isCheckingAccess: false,
  };
}
