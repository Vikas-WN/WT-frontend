"use client";

import { useQuery } from "@tanstack/react-query";

import { SEASONAL_QUERY_KEYS } from "@/constants/seasonal";
import { hrmsService } from "@/services/hrms.service";

/** Today's seasonal look as decided by the server (date + HR's switch). Changes at most daily, so it is cached for an hour. */
export function useSeasonalTheme() {
  return useQuery({
    queryKey: SEASONAL_QUERY_KEYS.current,
    queryFn: () => hrmsService.getSeasonalTheme(),
    staleTime: 60 * 60_000,
    retry: false,
  });
}
