"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hrmsService } from "@/services/hrms.service";
import { parseClientList, parseClientListPage, parseClientRow } from "@/utils/client";
import { invalidateAllocationDependentQueries } from "@/utils/allocationQueryInvalidation";
import type { ClientListPage, ClientRecord } from "@/types/client";

type UseClientsOptions = {
  enabled?: boolean;
  search?: string;
  activeOnly?: boolean;
  includeProjects?: boolean;
  /** When omitted, dropdowns fetch a larger page for local filtering. */
  size?: number;
};

type UseClientsPageOptions = {
  enabled?: boolean;
  search?: string;
  status?: "active" | "inactive";
  includeProjects?: boolean;
  page?: number;
  size?: number;
};

export function useClients({
  enabled = true,
  search,
  activeOnly = false,
  includeProjects = false,
  size = 500,
}: UseClientsOptions = {}) {
  return useQuery({
    queryKey: ["clients", "list", search ?? "", activeOnly, includeProjects, size],
    enabled,
    queryFn: async (): Promise<ClientRecord[]> => {
      const res = await hrmsService.listClients({
        ...(search ? { search } : {}),
        activeOnly,
        includeProjects,
        page: 0,
        size,
      });
      return parseClientList(res);
    },
    staleTime: includeProjects ? 30_000 : 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useClientsPage({
  enabled = true,
  search,
  status,
  includeProjects = false,
  page = 0,
  size = 25,
}: UseClientsPageOptions = {}) {
  return useQuery({
    queryKey: ["clients", "page", search ?? "", status ?? "all", includeProjects, page, size],
    enabled,
    queryFn: async (): Promise<ClientListPage> => {
      const res = await hrmsService.listClients({
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        includeProjects,
        page,
        size,
      });
      return parseClientListPage(res);
    },
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useClientDetail(clientId: number | null, includeProjects = false) {
  return useQuery({
    queryKey: ["clients", "detail", clientId, includeProjects],
    enabled: clientId != null && clientId > 0,
    queryFn: async (): Promise<ClientRecord | null> => {
      if (!clientId) return null;
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
