"use client";

import { useQuery } from "@tanstack/react-query";

import { CHAT_POLL, CHAT_QUERY_KEYS } from "@/constants/chat";
import { chatService } from "@/services/chat.service";
import type { ChatConversation } from "@/types/chat";

/** My conversations, newest activity first, with unread counts. Refreshes while the tab is visible. */
export function useChatConversations() {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.conversations,
    queryFn: async (): Promise<ChatConversation[]> => (await chatService.conversations()).data ?? [],
    refetchInterval: CHAT_POLL.conversations,
    refetchIntervalInBackground: false,
    staleTime: 2_000,
  });
}

/** The number on the sidebar badge: unread messages across every conversation. */
export function useChatUnreadCount(enabled = true) {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.unread,
    queryFn: async (): Promise<number> => (await chatService.unread()).data?.count ?? 0,
    enabled,
    refetchInterval: CHAT_POLL.unread,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });
}
