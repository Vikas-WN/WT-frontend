"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { UTILIZATION_QUERY_KEY } from "@/constants/utilizationHeatmap";
import { utilizationService } from "@/services/utilization.service";
import type { WeeklyUtilization, WeeklyUtilizationQuery } from "@/types/utilization";

export function useWeeklyUtilization(params: WeeklyUtilizationQuery) {
  return useQuery({
    queryKey: [...UTILIZATION_QUERY_KEY, params.start ?? "", params.weeks ?? 0, params.department ?? "", params.search ?? ""],
    queryFn: async (): Promise<WeeklyUtilization | null> => (await utilizationService.weekly(params)).data ?? null,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
