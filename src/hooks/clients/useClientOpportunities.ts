"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/error";
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
      try {
        const res = await hrmsService.listClientOpportunities({
          clientId: resolvedClientId,
          ...(search ? { search } : {}),
          ...(status?.length ? { status } : {}),
        });
        return parseOpportunityList(res);
      } catch (err) {
        // A 400/404 means WK Business does not recognise this client id (e.g. a
        // seed/demo client, or one never synced from WK Business). That is a data
        // condition — the client simply has no opportunities to show — not a
        // failure, so surface it as an empty list instead of an error state.
        // Genuine outages (502 unreachable / 5xx) and a disabled integration
        // (503) still propagate so they stay visible.
        if (err instanceof ApiError && (err.status === 400 || err.status === 404)) {
          return EMPTY;
        }
        throw err;
      }
    },
    staleTime: 30_000,
  });
}
