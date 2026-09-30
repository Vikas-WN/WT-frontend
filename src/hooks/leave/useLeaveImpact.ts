"use client";

import { useQuery } from "@tanstack/react-query";
import { LEAVE_FIGURES_STALE_MS, MY_LEAVE_IMPACT_QUERY_KEY } from "@/constants/leaveQueryKeys";
import { hrmsService, type LeaveImpactData } from "@/services/hrms.service";
import { toApiDateParam } from "@/utils/apiDate";

/** What a leave for these dates would do to the balance, before it is submitted. */
export function useLeaveImpact(params: { fromDate: string; toDate: string; isHalfDay: boolean; enabled: boolean }) {
  const from = params.fromDate ? (toApiDateParam(params.fromDate) ?? "") : "";
  const to = params.toDate ? (toApiDateParam(params.toDate) ?? "") : "";
  return useQuery({
    queryKey: [...MY_LEAVE_IMPACT_QUERY_KEY, from, to, params.isHalfDay],
    enabled: params.enabled && Boolean(from) && Boolean(to),
    staleTime: LEAVE_FIGURES_STALE_MS,
    queryFn: async (): Promise<LeaveImpactData | null> => {
      const res = await hrmsService.getMyLeaveImpact({ fromDate: from, toDate: to, isHalfDay: params.isHalfDay });
      return res.data ?? null;
    },
  });
}
