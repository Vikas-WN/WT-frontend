"use client";

import { useQuery } from "@tanstack/react-query";
import { hrmsService } from "@/services/hrms.service";

/** Filter choices for the timelog export dialog. Only fetched while the dialog is open. */
export function useTimelogReportOptions(enabled: boolean) {
  const query = useQuery({
    queryKey: ["timelog-report-options"],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => (await hrmsService.getTimelogReportOptions()).data ?? null,
  });
  return {
    options: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? "Could not load the filters." : null,
    reload: () => void query.refetch(),
  };
}
