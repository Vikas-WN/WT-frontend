"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { hrmsService } from "@/services/hrms.service";
import { parseDesignationList } from "@/utils/masters";

export type DesignationSelectOption = { value: string; label: string };

/**
 * Designations for a band + department pair. Returns an empty list when either input is missing
 * so cached results from a previous selection are never shown.
 */
export function useDesignationSelectOptions(department: string, bandId: number) {
  const dept = department.trim();
  const enabled = bandId > 0 && Boolean(dept);

  const query = useQuery({
    queryKey: ["masters", "designations", dept, bandId],
    enabled,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const res = await hrmsService.searchDesignations({ band_id: bandId, department: dept });
      return parseDesignationList(res).map((item) => ({
        value: item.name,
        label: item.name,
      }));
    },
  });

  const options: DesignationSelectOption[] = useMemo(() => {
    if (!enabled) return [];
    return query.data ?? [];
  }, [enabled, query.data]);

  const loading = enabled && (query.isLoading || query.isFetching);

  return { options, loading, isError: query.isError, error: query.error };
}
