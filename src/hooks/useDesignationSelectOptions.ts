"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { hrmsService } from "@/services/hrms.service";
import { parseDesignationList } from "@/utils/masters";

export type DesignationSelectOption = { value: string; label: string };

function uniqueSortedOptions(items: DesignationSelectOption[]): DesignationSelectOption[] {
  const byName = new Map<string, DesignationSelectOption>();
  for (const item of items) {
    const key = item.value.trim();
    if (!key || byName.has(key)) continue;
    byName.set(key, { value: key, label: item.label.trim() || key });
  }
  return Array.from(byName.values()).sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Designations for a band + department pair.
 *
 * Pass `bandIds` (e.g. all non-intern bands for consultants) to union designations
 * across those bands for the department. Returns an empty list when inputs are
 * incomplete so cached results from a previous selection are never shown.
 */
export function useDesignationSelectOptions(
  department: string,
  bandId: number,
  bandIds?: number[]
) {
  const dept = department.trim();
  const multiBandIds = useMemo(
    () =>
      Array.from(
        new Set((bandIds ?? []).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))
      ).sort((a, b) => a - b),
    [bandIds]
  );
  const useMulti = multiBandIds.length > 0;
  const enabled = Boolean(dept) && (useMulti || bandId > 0);

  const query = useQuery({
    queryKey: useMulti
      ? ["masters", "designations", dept, "multi", multiBandIds]
      : ["masters", "designations", dept, bandId],
    enabled,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      if (useMulti) {
        const lists = await Promise.all(
          multiBandIds.map((id) =>
            hrmsService.searchDesignations({ band_id: id, department: dept })
          )
        );
        return uniqueSortedOptions(
          lists.flatMap((res) =>
            parseDesignationList(res).map((item) => ({
              value: item.name,
              label: item.name,
            }))
          )
        );
      }

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
