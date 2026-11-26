"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  NEXT_BAND_KPIS_QUERY_KEY,
  NEXT_BAND_KPIS_STALE_TIME_MS,
} from "@/constants/nextBandKpis";
import { nextBandKpisService } from "@/services/nextBandKpis.service";

/** The signed-in employee's own next-band KPIs. */
export function useNextBandKpis() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...NEXT_BAND_KPIS_QUERY_KEY, user?.email ?? "anonymous"] as const,
    enabled: Boolean(user),
    staleTime: NEXT_BAND_KPIS_STALE_TIME_MS,
    retry: false,
    queryFn: nextBandKpisService.getMine,
  });
}
