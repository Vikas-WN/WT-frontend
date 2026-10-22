"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { DATA_CHANGED, DATA_REVISION_KEY } from "@/lib/dataRefresh";
import { HOME_UPDATES_QUERY_KEY } from "@/constants/homeUpdates";
import { HOME_APPROVALS_QUERY_KEY } from "@/constants/homeCards";
import { useQueryClient, useQuery } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const pathname = usePathname();
  useEffect(() => {
    if (!options.enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["sidebar"] });
        void queryClient.invalidateQueries({ queryKey: HOME_UPDATES_QUERY_KEY });
        void queryClient.invalidateQueries({ queryKey: HOME_APPROVALS_QUERY_KEY });
      }, 250);
    };
    const storage = (event: StorageEvent) => { if (event.key === DATA_REVISION_KEY) refresh(); };
    refresh();
    window.addEventListener(DATA_CHANGED, refresh);
    window.addEventListener("storage", storage);
    return () => { clearTimeout(timer); window.removeEventListener(DATA_CHANGED, refresh); window.removeEventListener("storage", storage); };
  }, [pathname, options.enabled, queryClient]);
  const approvals = useHomePendingApprovals(options.enabled && options.isApprover);

  const learning = useQuery({
    queryKey: ["sidebar", "learning-overdue"],
    enabled: options.enabled,
    staleTime: BADGE_STALE_MS,
    refetchInterval: 30_000,
    refetchOnWindowFocus: "always",
    retry: false,
    queryFn: async () => (await hrmsService.getMyLearningSummary()).data?.overdue_mandatory_count ?? 0,
  });

  const compliance = useQuery({
    queryKey: ["sidebar", "compliance-flagged"],
    enabled: options.enabled && options.hasHrAccess,
    staleTime: BADGE_STALE_MS,
    refetchInterval: 30_000,
    refetchOnWindowFocus: "always",
    retry: false,
    queryFn: async () =>
      (await hrmsService.getComplianceNudges({ category: "missing_documents", page: 0, pageSize: 1 })).data?.counts?.total_flagged ?? 0,
  });

  return {
    requests: approvals.count,
    learning: learning.isError ? null : learning.data ?? null,
    compliance: compliance.isError ? null : compliance.data ?? null,
  };
}
