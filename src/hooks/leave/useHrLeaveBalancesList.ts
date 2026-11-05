"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { hrmsService, type LeaveBalancesListData } from "@/services/hrms.service";

export const HR_LEAVE_BALANCES_QUERY_KEY = ["leave", "hr-balances-list"] as const;

function validateLeaveBalanceYear(yearRaw: string): number {
  const currentYear = new Date().getFullYear();
  const yearText = String(yearRaw ?? "").trim();
  if (!yearText) throw new Error("Year is required. Select a valid year before searching.");
  const year = Number(yearText);
  if (!Number.isInteger(year) || year < 2000 || year > currentYear) {
    throw new Error(`Enter a valid year between 2000 and ${currentYear}.`);
  }
  return year;
}

export function useHrLeaveBalancesList(params: {
  year: string;
  page: number;
  pageSize: number;
  search: string;
  enabled?: boolean;
}) {
  const { year, page, pageSize, search, enabled = true } = params;
  const trimmedSearch = search.trim();

  return useQuery({
    queryKey: [
      ...HR_LEAVE_BALANCES_QUERY_KEY,
      year,
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
      const yearNum = validateLeaveBalanceYear(year);
      const res = await hrmsService.getLeaveBalancesList({
        page,
        size: pageSize,
        search: trimmedSearch || undefined,
        year: yearNum,
      });
      return (
        res.data ?? {
          items: [],
          total_pages: 1,
          total_elements: 0,
          current_page: 0,
          page_size: pageSize,
          year: yearNum,
          month: yearNum === new Date().getFullYear() ? new Date().getMonth() + 1 : 12,
        }
      );
    },
  });
}

export { validateLeaveBalanceYear };
