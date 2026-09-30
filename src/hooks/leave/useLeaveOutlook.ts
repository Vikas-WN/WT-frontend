"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { LEAVE_FIGURES_STALE_MS, MY_LEAVE_OUTLOOK_QUERY_KEY } from "@/constants/leaveQueryKeys";
import { hrmsService, type LeaveMonthlyOutlookData } from "@/services/hrms.service";

/** The employee's month-by-month leave plan: what is credited each month and what each coming
 *  month's balance looks like with approved (and pending) leave. */
export function useLeaveOutlook(options?: { enabled?: boolean; months?: number }) {
  const { user } = useAuth();
  const months = options?.months ?? 6;
  return useQuery({
    queryKey: [...MY_LEAVE_OUTLOOK_QUERY_KEY, user?.email ?? "", months],
    enabled: (options?.enabled ?? true) && Boolean(user),
    staleTime: LEAVE_FIGURES_STALE_MS,
    refetchOnWindowFocus: "always",
    queryFn: async (): Promise<LeaveMonthlyOutlookData | null> => {
      const res = await hrmsService.getMyLeaveOutlook(months);
      return res.data ?? null;
    },
  });
}
