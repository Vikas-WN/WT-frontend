"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CHAT_QUERY_KEYS } from "@/constants/chat";
import { notifyError, notifySuccess } from "@/lib/notify";
import { chatService } from "@/services/chat.service";
import type { ChatChannelSummary, ChatPerson, ChatReport, CreateChannelPayload } from "@/types/chat";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

function useRefreshConversations() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations });
    void queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.unread });
  };
}

/** Everything that changes who is in which conversation. Each returns the conversation id to open where that applies. */
export function useChatMembership() {
  const refresh = useRefreshConversations();
  const queryClient = useQueryClient();
  const fail = (error: unknown, fallback: string) => notifyError(apiErrorMessage(error, fallback));

  const openDm = useMutation({
    mutationFn: async (userId: number) => (await chatService.openDm(userId)).data?.id ?? 0,
    onSuccess: refresh,
    onError: (e) => fail(e, "Couldn't open that conversation."),
  });
  const createChannel = useMutation({
    mutationFn: async (payload: CreateChannelPayload) => (await chatService.createChannel(payload)).data?.id ?? 0,
    onSuccess: () => {
      refresh();
      void queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.browse });
    },
    onError: (e) => fail(e, "Couldn't create the channel."),
  });
  const join = useMutation({
    mutationFn: async (id: number) => {
      await chatService.join(id);
      return id;
    },
    onSuccess: () => {
      refresh();
      void queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.browse });
    },
    onError: (e) => fail(e, "Couldn't join the channel."),
  });
  const leave = useMutation({
    mutationFn: async (id: number) => {
      await chatService.leave(id);
      return id;
    },
    onSuccess: () => {
      refresh();
      void queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.browse });
    },
    onError: (e) => fail(e, "Couldn't leave the channel."),
  });
  return { openDm, createChannel, join, leave };
}

export function useReportMessage() {
  return useMutation({
    mutationFn: ({ messageId, reason }: { messageId: number; reason: string }) => chatService.report(messageId, reason),
    onSuccess: () => notifySuccess("Thanks — HR has been told."),
    onError: (e) => notifyError(apiErrorMessage(e, "Couldn't send the report.")),
  });
}

export function useChatPeople(query: string) {
  const term = query.trim();
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.people(term),
    queryFn: async (): Promise<ChatPerson[]> => (await chatService.people(term)).data ?? [],
    enabled: term.length >= 1,
    staleTime: 30_000,
  });
}

export function useBrowseChannels(enabled: boolean) {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.browse,
    queryFn: async (): Promise<ChatChannelSummary[]> => (await chatService.browseChannels()).data ?? [],
    enabled,
  });
}

/** HR/Admin: reported messages, and closing a report. */
export function useChatReports(enabled: boolean) {
  const queryClient = useQueryClient();
  const reports = useQuery({
    queryKey: CHAT_QUERY_KEYS.reports,
    queryFn: async (): Promise<ChatReport[]> => (await chatService.reports(true)).data ?? [],
    enabled,
    staleTime: 15_000,
  });
  const resolve = useMutation({
    mutationFn: ({ reportId, outcome }: { reportId: number; outcome: string }) => chatService.resolveReport(reportId, outcome),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.reports }),
    onError: (e) => notifyError(apiErrorMessage(e, "Couldn't close the report.")),
  });
  return { reports, resolve };
}
