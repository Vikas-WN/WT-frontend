"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { LEAVE_FIGURES_STALE_MS, MY_LEAVE_BALANCE_QUERY_KEY } from "@/constants/leaveQueryKeys";
import { hrmsService, type EmployeeLeaveBalancesData } from "@/services/hrms.service";

export function useMyLeaveBalance(options?: { enabled?: boolean }) {
  const { user } = useAuth();
  const enabled = (options?.enabled ?? true) && Boolean(user);

  return useQuery({
    queryKey: [...MY_LEAVE_BALANCE_QUERY_KEY, user?.email ?? ""],
    enabled,
    staleTime: LEAVE_FIGURES_STALE_MS,
    refetchOnWindowFocus: "always",
    queryFn: async (): Promise<EmployeeLeaveBalancesData | null> => {
      const res = await hrmsService.getMyLeaveBalance();
      return res.data ?? null;
    },
  });
}
