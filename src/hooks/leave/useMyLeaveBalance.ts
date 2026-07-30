"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { hrmsService, type EmployeeLeaveBalancesData } from "@/services/hrms.service";

export function useMyLeaveBalance(options?: { enabled?: boolean; year?: number; month?: number }) {
  const { user } = useAuth();
  const enabled = (options?.enabled ?? true) && Boolean(user);
  const today = new Date();
  const year = options?.year ?? today.getFullYear();
  const month = options?.month ?? (today.getMonth() + 1);

  return useQuery({
    queryKey: ["leave", "my-balance", user?.email ?? "", year, month],
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<EmployeeLeaveBalancesData | null> => {
      const res = await hrmsService.getMyLeaveBalance(year, month);
      return res.data ?? null;
    },
  });
}
