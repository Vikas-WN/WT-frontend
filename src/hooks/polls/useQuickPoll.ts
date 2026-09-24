"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hrmsService } from "@/services/hrms.service";

export const CURRENT_POLL_QUERY_KEY = ["polls", "current"];

export function useCurrentPoll() {
  return useQuery({
    queryKey: CURRENT_POLL_QUERY_KEY,
    queryFn: async () => {
      const res = await hrmsService.getCurrentPoll();
      return res.data ?? null;
    },
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}

export function useVoteOnPoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: number; optionId: number }) =>
      hrmsService.voteOnPoll(pollId, optionId),
    onSuccess: (res) => {
      queryClient.setQueryData(CURRENT_POLL_QUERY_KEY, res.data ?? null);
    },
  });
}

export function useCreatePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { question: string; options: string[] }) => hrmsService.createPoll(payload),
    onSuccess: (res) => {
      queryClient.setQueryData(CURRENT_POLL_QUERY_KEY, res.data ?? null);
    },
  });
}

export function useClosePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pollId: number) => hrmsService.closePoll(pollId),
    onSuccess: () => {
      queryClient.setQueryData(CURRENT_POLL_QUERY_KEY, null);
    },
  });
}
