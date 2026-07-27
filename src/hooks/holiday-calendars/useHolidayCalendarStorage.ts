"use client";

import { useQuery } from "@tanstack/react-query";
import { holidayCalendarStorageService } from "@/services/holidayCalendarStorage.service";

export function holidayCalendarStorageQueryKey(year: number | string) {
  return ["holiday-calendar", "storage", String(year)] as const;
}

/** True when year is a usable calendar year for storage API calls (2000–9999). */
export function isValidHolidayCalendarYear(year: number | string): boolean {
  const normalized = Number(year);
  return Number.isInteger(normalized) && normalized >= 2000 && normalized <= 9999;
}

export function useHolidayCalendarStorage(year: number | string) {
  const normalizedYear = Number(year);
  const isValidYear = isValidHolidayCalendarYear(year);

  return useQuery({
    queryKey: holidayCalendarStorageQueryKey(isValidYear ? normalizedYear : "invalid"),
    queryFn: () => holidayCalendarStorageService.fetchByYear(normalizedYear),
    enabled: isValidYear,
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
