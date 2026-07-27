"use client";

import { useQuery } from "@tanstack/react-query";
import { holidayCalendarStorageService } from "@/services/holidayCalendarStorage.service";

export function holidayCalendarStorageQueryKey(year: number | string) {
  return ["holiday-calendar", "storage", String(year)] as const;
}

export function useHolidayCalendarStorage(year: number | string) {
  const normalizedYear = Number(year);
  const isValidYear = Number.isInteger(normalizedYear) && normalizedYear >= 2000 && normalizedYear<=9999;

  return useQuery({
    queryKey: holidayCalendarStorageQueryKey(isValidYear ? normalizedYear : "Please enter the valid year"),
    queryFn: () => holidayCalendarStorageService.fetchByYear(normalizedYear),
    enabled: Number.isFinite(normalizedYear),
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
