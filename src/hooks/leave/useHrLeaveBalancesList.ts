"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { hrmsService, type LeaveBalancesListData } from "@/services/hrms.service";

export const HR_LEAVE_BALANCES_QUERY_KEY = ["leave", "hr-balances-list"] as const;

function validateLeaveBalancePeriod(yearRaw: string, monthRaw: string): {
  year: number;
  month: number;
} {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const year = Number(String(yearRaw).trim());
  const month = Number(String(monthRaw).trim());

  if (!Number.isInteger(year) || year < 2000 || year > currentYear) {
    throw new Error(`Enter a valid year between 2000 and ${currentYear}.`);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Enter a valid month between 1 and 12.");
  }
  if (year === currentYear && month > currentMonth) {
    throw new Error("Future months are not allowed.");
  }
  return { year, month };
}

export function useHrLeaveBalancesList(params: {
  year: string;
  month: string;
  page: number;
  pageSize: number;
  search: string;
  enabled?: boolean;
}) {
  const { year, month, page, pageSize, search, enabled = true } = params;
  const trimmedSearch = search.trim();

  return useQuery({
    queryKey: [
      ...HR_LEAVE_BALANCES_QUERY_KEY,
      year,
      month,
      page,
      pageSize,
      trimmedSearch,
    ],
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<LeaveBalancesListData> => {
      const { year: yearNum, month: monthNum } = validateLeaveBalancePeriod(year, month);
      const res = await hrmsService.getLeaveBalancesList({
        page,
        size: pageSize,
        search: trimmedSearch || undefined,
        year: yearNum,
        month: monthNum,
      });
      return (
        res.data ?? {
          items: [],
          total_pages: 1,
          total_elements: 0,
          current_page: 0,
          page_size: pageSize,
          year: yearNum,
          month: monthNum,
        }
      );
    },
  });
}

export { validateLeaveBalancePeriod };
