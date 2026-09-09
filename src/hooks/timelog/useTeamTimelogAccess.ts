"use client";

import { useAuth } from "@/context/AuthContext";
import { normalizeRoles } from "@/utils/roles";

export const TEAM_TIMELOG_ACCESS_QUERY_KEY = ["timelog", "team-access"] as const;

const TEAM_TIMELOG_ROLES = new Set([
  "ROLE_MANAGER",
  // Delivery and Account Managers run the manager portal for the projects they
  // own — the allocation import already flags all three designations
  // is_manager, and the API scopes the response to the actor's own projects.
  // Excluding them here made the team / project time-log view unreachable and
  // bounced them back to their personal time logs.
  "ROLE_DM",
  "ROLE_AM",
  "ROLE_HR",
  "ROLE_ADMIN",
]);

/**
 * Managers (Project / Delivery / Account), HR, and Admin may open team /
 * project time-log views. Pure employees may not.
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
