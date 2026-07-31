"use client";

import { useQuery } from "@tanstack/react-query";
import { hrmsService } from "@/services/hrms.service";
import { parseOpportunityList } from "@/utils/opportunity";
import type { OpportunityListResult } from "@/types/opportunity";

type UseClientOpportunitiesOptions = {
  clientId: string | null;
  enabled?: boolean;
  search?: string;
  status?: string[];
};

const EMPTY: OpportunityListResult = { items: [], total: 0 };

export function useClientOpportunities({
  clientId,
  enabled = true,
  search,
  status,
}: UseClientOpportunitiesOptions) {
  const resolvedClientId = clientId?.trim() || null;

  return useQuery({
    queryKey: ["client-opportunities", resolvedClientId, search ?? "", status?.join(",") ?? ""],
    enabled: enabled && Boolean(resolvedClientId),
    queryFn: async (): Promise<OpportunityListResult> => {
      if (!resolvedClientId) return EMPTY;
      const res = await hrmsService.listClientOpportunities({
        clientId: resolvedClientId,
        ...(search ? { search } : {}),
        ...(status?.length ? { status } : {}),
      });
      return parseOpportunityList(res);
    },
    staleTime: 30_000,
  });
}
