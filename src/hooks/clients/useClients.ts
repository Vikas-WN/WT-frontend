"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hrmsService } from "@/services/hrms.service";
import { parseClientList, parseClientRow } from "@/utils/client";
import { invalidateAllocationDependentQueries } from "@/utils/allocationQueryInvalidation";
import type { ClientRecord } from "@/types/client";

type UseClientsOptions = {
  enabled?: boolean;
  search?: string;
  activeOnly?: boolean;
  includeProjects?: boolean;
};

export function useClients({
  enabled = true,
  search,
  activeOnly = false,
  includeProjects = false,
}: UseClientsOptions = {}) {
  return useQuery({
    queryKey: ["clients", search ?? "", activeOnly, includeProjects],
    enabled,
    queryFn: async (): Promise<ClientRecord[]> => {
      const res = await hrmsService.listClients({
        ...(search ? { search } : {}),
        activeOnly,
        includeProjects,
      });
      return parseClientList(res);
    },
    staleTime: includeProjects ? 0 : 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useClientDetail(clientId: string | number | null, includeProjects = false) {
  return useQuery({
    queryKey: ["clients", "detail", clientId, includeProjects],
    enabled: clientId != null && String(clientId).trim() !== "",
    queryFn: async (): Promise<ClientRecord | null> => {
      if (clientId == null || String(clientId).trim() === "") return null;
      const res = await hrmsService.getClient(clientId, { includeProjects });
      const payload = (res as { data?: unknown }).data ?? res;
      if (!payload || typeof payload !== "object") return null;
      return parseClientRow(payload as Record<string, unknown>);
    },
    staleTime: 30_000,
  });
}

export function useInvalidateClients() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["clients"] });
    invalidateAllocationDependentQueries(queryClient);
  };
}
