"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

import { CHAT_LIMITS, CHAT_POLL, CHAT_QUERY_KEYS } from "@/constants/chat";
import { notifyError } from "@/lib/notify";
import { chatService } from "@/services/chat.service";
import type { ChatMessage } from "@/types/chat";
import { lastRealId, mergeMessages } from "@/utils/chatMessages";

interface ThreadData {
  messages: ChatMessage[];
  hasMore: boolean;
  firstUnreadId: number | null;
}

/**
 * One conversation's messages. The first load reads the latest page; after that each poll only asks for what is newer than
 * the last message it has, and every 30 seconds it re-reads the latest page in full so edits and deletions by others appear.
 */
export function useChatThread(conversationId: number | null) {
  const queryClient = useQueryClient();
  const lastFullRefresh = useRef<Record<number, number>>({});
  const key = CHAT_QUERY_KEYS.messages(conversationId ?? 0);

  const query = useQuery({
    queryKey: key,
    enabled: conversationId !== null,
    refetchInterval: CHAT_POLL.messages,
    refetchIntervalInBackground: false,
    staleTime: 0,
    queryFn: async (): Promise<ThreadData> => {
      const id = conversationId as number;
      const cached = queryClient.getQueryData<ThreadData>(key);
      const dueForFull = !cached || Date.now() - (lastFullRefresh.current[id] ?? 0) > CHAT_POLL.fullRefreshMs;
      if (dueForFull) {
        const page = (await chatService.messages(id, { limit: CHAT_LIMITS.pageSize })).data;
        lastFullRefresh.current[id] = Date.now();
        return {
          messages: mergeMessages(cached?.messages ?? [], page?.messages ?? []),
          hasMore: cached?.hasMore ?? Boolean(page?.has_more),
          firstUnreadId: cached ? cached.firstUnreadId : (page?.first_unread_id ?? null),
        };
      }
      const page = (await chatService.messages(id, { afterId: lastRealId(cached.messages) })).data;
      const fresh = page?.messages ?? [];
      return fresh.length ? { ...cached, messages: mergeMessages(cached.messages, fresh) } : cached;
    },
  });

  const loadOlder = useCallback(async () => {
    const id = conversationId;
    const data = queryClient.getQueryData<ThreadData>(key);
    if (id === null || !data) return;
    const oldest = data.messages.find((m) => m.id > 0)?.id;
    if (!oldest) return;
    try {
      const page = (await chatService.messages(id, { beforeId: oldest, limit: CHAT_LIMITS.pageSize })).data;
      queryClient.setQueryData<ThreadData>(key, (current) =>
        current ? { ...current, messages: mergeMessages(page?.messages ?? [], current.messages), hasMore: Boolean(page?.has_more) } : current
      );
    } catch {
      notifyError("Couldn't load earlier messages.");
    }
  }, [conversationId, key, queryClient]);

  /** Sends a message, showing it at once as pending. Returns false (and removes it) if it could not be sent. */
  const send = useCallback(
    async (body: string, senderName: string): Promise<boolean> => {
      const id = conversationId;
      if (id === null) return false;
      const temp: ChatMessage = {
        id: -Date.now(),
        conversation_id: id,
        sender_id: 0,
        sender_name: senderName,
        body,
        created_at: new Date().toISOString(),
        edited: false,
        deleted: false,
        mine: true,
        pending: true,
      };
      const put = (fn: (messages: ChatMessage[]) => ChatMessage[]) =>
        queryClient.setQueryData<ThreadData>(key, (c) => (c ? { ...c, messages: fn(c.messages) } : { messages: fn([]), hasMore: false, firstUnreadId: null }));
      put((list) => [...list, temp]);
      try {
        const sent = (await chatService.send(id, body)).data;
        put((list) => mergeMessages(list.filter((m) => m.id !== temp.id), sent ? [sent] : []));
        void queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations });
        return true;
      } catch {
        put((list) => list.filter((m) => m.id !== temp.id));
        notifyError("Couldn't send that message.");
        return false;
      }
    },
    [conversationId, key, queryClient]
  );

  const patchMessage = useCallback(
    (messageId: number, change: Partial<ChatMessage>) =>
      queryClient.setQueryData<ThreadData>(key, (c) => (c ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...change } : m)) } : c)),
    [key, queryClient]
  );

  return {
    messages: query.data?.messages ?? [],
    hasMore: query.data?.hasMore ?? false,
    firstUnreadId: query.data?.firstUnreadId ?? null,
    isLoading: query.isLoading,
    isError: query.isError && !query.data,
    refetch: query.refetch,
    loadOlder,
    send,
    patchMessage,
  };
}
