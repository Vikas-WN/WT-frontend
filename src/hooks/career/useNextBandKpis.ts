"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  NEXT_BAND_KPIS_QUERY_KEY,
  NEXT_BAND_KPIS_STALE_TIME_MS,
} from "@/constants/nextBandKpis";
import { nextBandKpisService } from "@/services/nextBandKpis.service";

/** Own KPIs when `empId` is omitted; otherwise the given employee's (HR/Admin only). */
export function useNextBandKpis(options: { empId?: string; enabled?: boolean } = {}) {
  const { empId, enabled = true } = options;
  const { user } = useAuth();
  const scope = empId ?? user?.email ?? "anonymous";

  return useQuery({
    queryKey: [...NEXT_BAND_KPIS_QUERY_KEY, scope] as const,
    enabled: enabled && Boolean(user),
    staleTime: NEXT_BAND_KPIS_STALE_TIME_MS,
    retry: false,
    queryFn: () =>
      empId ? nextBandKpisService.getForEmployee(empId) : nextBandKpisService.getMine(),
  });
}
