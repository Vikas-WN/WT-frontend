"use client";

import { useQuery } from "@tanstack/react-query";

import { useHomePendingApprovals } from "@/hooks/dashboard/useHomePendingApprovals";
import { hrmsService } from "@/services/hrms.service";

export interface SidebarBadges {
  requests: number | null;
  learning: number | null;
  compliance: number | null;
}

const BADGE_STALE_MS = 120_000;

/**
 * The counts shown beside some sidebar entries: requests waiting for you, mandatory trainings overdue, and (HR/Admin) people
 * flagged by compliance. Each is fetched only for the people who can see that entry, and a failed or empty count shows nothing.
 */
export function useSidebarBadges(options: { isApprover: boolean; hasHrAccess: boolean; enabled: boolean }): SidebarBadges {
  const approvals = useHomePendingApprovals(options.enabled && options.isApprover);

  const learning = useQuery({
    queryKey: ["sidebar", "learning-overdue"],
    enabled: options.enabled,
    staleTime: BADGE_STALE_MS,
    retry: false,
    queryFn: async () => (await hrmsService.getMyLearningSummary()).data?.overdue_mandatory_count ?? 0,
  });

  const compliance = useQuery({
    queryKey: ["sidebar", "compliance-flagged"],
    enabled: options.enabled && options.hasHrAccess,
    staleTime: BADGE_STALE_MS,
    retry: false,
    queryFn: async () =>
      (await hrmsService.getComplianceNudges({ category: "missing_documents", page: 0, pageSize: 1 })).data?.counts?.total_flagged ?? 0,
  });

  return {
    requests: approvals.count,
    learning: learning.data ?? null,
    compliance: compliance.data ?? null,
  };
}
