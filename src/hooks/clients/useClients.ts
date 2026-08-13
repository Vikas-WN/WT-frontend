"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hrmsService } from "@/services/hrms.service";
import {
  attachProjectsToClients,
  parseClientList,
  parseClientListPage,
  parseClientRow,
} from "@/utils/client";
import { invalidateAllocationDependentQueries } from "@/utils/allocationQueryInvalidation";
import { fetchHrProjects, HR_PROJECTS_QUERY_KEY } from "@/hooks/allocation/useHrProjects";
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
  const clientsQuery = useQuery({
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
  const projectsQuery = useQuery({
    queryKey: HR_PROJECTS_QUERY_KEY,
    enabled: enabled && includeProjects,
    queryFn: fetchHrProjects,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const data = useMemo(() => {
    const items = clientsQuery.data;
    if (!items || !includeProjects) return items;
    return attachProjectsToClients(items, projectsQuery.data?.pickerRows ?? []);
  }, [clientsQuery.data, includeProjects, projectsQuery.data?.pickerRows]);

  return { ...clientsQuery, data };
}

export function useClientsPage({
  enabled = true,
  search,
  status,
  includeProjects = false,
  page = 0,
  size = 25,
}: UseClientsPageOptions = {}) {
  const clientsQuery = useQuery({
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
  const projectsQuery = useQuery({
    queryKey: HR_PROJECTS_QUERY_KEY,
    enabled: enabled && includeProjects,
    queryFn: fetchHrProjects,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const data = useMemo(() => {
    const pageData = clientsQuery.data;
    if (!pageData || !includeProjects) return pageData;
    const items = attachProjectsToClients(pageData.items, projectsQuery.data?.pickerRows ?? []);
    const withProjects = items.filter((item) => item.projectCount > 0).length;
    return {
      ...pageData,
      items,
      summary: pageData.summary
        ? {
            ...pageData.summary,
            withProjects:
              pageData.summary.withProjects > 0
                ? pageData.summary.withProjects
                : withProjects,
          }
        : pageData.summary,
    };
  }, [clientsQuery.data, includeProjects, projectsQuery.data?.pickerRows]);

  return { ...clientsQuery, data };
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
    void queryClient.invalidateQueries({ queryKey: HR_PROJECTS_QUERY_KEY });
    invalidateAllocationDependentQueries(queryClient);
  };
}
