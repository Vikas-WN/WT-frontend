"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hrmsService, type CelebrationKind } from "@/services/hrms.service";

export const CELEBRATIONS_QUERY_KEY = ["celebrations", "today-banner"];

export function useCelebrationsQuery() {
  return useQuery({
    queryKey: CELEBRATIONS_QUERY_KEY,
    queryFn: async () => {
      const res = await hrmsService.getCelebrations();
      return res.data ?? null;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useReactToCelebration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      celebrant_user_id: number;
      kind: CelebrationKind;
      occurrence_year: number;
      emoji: string;
    }) => hrmsService.reactToCelebration(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CELEBRATIONS_QUERY_KEY });
    },
  });
}
