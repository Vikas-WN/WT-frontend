"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { hrmsService } from "@/services/hrms.service";
import { normalizeProjectTimelogsData } from "@/utils/timelog/normalizeProjectTimelogs";

export const TEAM_TIMELOG_ACCESS_QUERY_KEY = ["timelog", "team-access"] as const;

export function canViewTeamTimelogsByRole(roles: string[]): boolean {
  return roles.some(
    (role) => role === "ROLE_MANAGER" || role === "ROLE_HR" || role === "ROLE_ADMIN"
  );
}

async function fetchHasPrimaryManagerTimelogInbox(): Promise<boolean> {
  const res = await hrmsService.getTimelogProjects();
  const data = normalizeProjectTimelogsData(
    ((res as { data?: unknown }).data ?? res) as unknown
  );
  return data.projects.length > 0 || data.pendingApprovals.length > 0;
}

/** Whether the signed-in user may open team / project time-log views. */
export function useTeamTimelogAccess() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const byRole = canViewTeamTimelogsByRole(roles);

  const inboxQuery = useQuery({
    queryKey: TEAM_TIMELOG_ACCESS_QUERY_KEY,
    enabled: Boolean(user) && !byRole,
    staleTime: 60_000,
    queryFn: fetchHasPrimaryManagerTimelogInbox,
  });

  return {
    canViewTeamTimelogs: byRole || (inboxQuery.data ?? false),
    isCheckingAccess: !byRole && inboxQuery.isLoading,
  };
}
