"use client";

import { useQuery } from "@tanstack/react-query";
import { hrmsService, type ComplianceCategory } from "@/services/hrms.service";

type UseComplianceNudgesOptions = {
  enabled?: boolean;
  category: ComplianceCategory;
  page: number;
  pageSize: number;
  search?: string;
};

export function useComplianceNudges({
  enabled = true,
  category,
  page,
  pageSize,
  search,
}: UseComplianceNudgesOptions) {
  return useQuery({
    queryKey: ["compliance", "nudges", category, page, pageSize, search ?? ""],
    enabled,
    queryFn: async () => {
      const res = await hrmsService.getComplianceNudges({
        category,
        page,
        pageSize,
        q: search,
      });
      return res.data ?? null;
    },
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
  });
}
