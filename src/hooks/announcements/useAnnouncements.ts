"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/error";
import { ANNOUNCEMENT_QUERY_KEYS, ANNOUNCEMENT_REFRESH_MS } from "@/constants/announcements";
import { notifyError, notifySuccess } from "@/lib/notify";
import { announcementService } from "@/services/announcements.service";
import { EMPTY_PAGE, type ListParams } from "@/types/paged";
import type { AnnouncementCreatePayload, AnnouncementUpdatePayload } from "@/types/announcement";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";

function apiErrorMessage(error: unknown, fallback: string): string {
  return toUserFriendlyApiErrorMessage(error, error instanceof ApiError ? error.message : fallback);
}

export function useAnnouncementsFeed(params: ListParams & { unread?: boolean } = {}, enabled = true) {
  return useQuery({
    queryKey: ANNOUNCEMENT_QUERY_KEYS.feedPage(params),
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => (await announcementService.feed(params)).data ?? EMPTY_PAGE,
    staleTime: 30_000,
    refetchInterval: ANNOUNCEMENT_REFRESH_MS,
    refetchOnWindowFocus: "always",
  });
}

export function useUnreadAnnouncements() {
  return useQuery({
    queryKey: ANNOUNCEMENT_QUERY_KEYS.unread,
    queryFn: async () => (await announcementService.unreadCount()).data?.unread ?? 0,
    staleTime: 30_000,
    refetchInterval: ANNOUNCEMENT_REFRESH_MS,
  });
}

export function useManagedAnnouncements(enabled: boolean, params: ListParams = {}) {
  return useQuery({
    queryKey: ANNOUNCEMENT_QUERY_KEYS.managedPage(params),
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => (await announcementService.managed(params)).data ?? EMPTY_PAGE,
    staleTime: 30_000,
  });
}

/** Who the signed-in person may target. Only fetched for people who can post. */
export function useAudienceOptions(enabled: boolean) {
  return useQuery({
    queryKey: ANNOUNCEMENT_QUERY_KEYS.audience,
    enabled,
    queryFn: async () => (await announcementService.audienceOptions()).data ?? null,
    staleTime: 5 * 60_000,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AnnouncementCreatePayload) => announcementService.create(payload),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_QUERY_KEYS.all });
      const reach = res.data?.recipient_count;
      notifySuccess(reach != null ? `Posted — sent to ${reach} ${reach === 1 ? "person" : "people"}.` : "Announcement posted.");
    },
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't post that announcement.")),
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AnnouncementUpdatePayload }) =>
      announcementService.update(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_QUERY_KEYS.all }),
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't update that announcement.")),
  });
}

/** Marks as read without a toast and updates the lists right away so the "New" dot clears at once. */
export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => announcementService.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_QUERY_KEYS.feed });
      void queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_QUERY_KEYS.unread });
    },
  });
}

/** Vote (or change a vote). The poll in the response is the fresh tally, so every list refreshes. */
export function useVotePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, optionIds }: { id: number; optionIds: string[] }) => announcementService.vote(id, optionIds),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_QUERY_KEYS.all }),
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't record your vote.")),
  });
}

/** Who voted for what. Only fetched while the results dialog is open. */
export function usePollResults(id: number) {
  return useQuery({
    queryKey: ANNOUNCEMENT_QUERY_KEYS.pollResults(id),
    queryFn: async () => (await announcementService.pollResults(id)).data ?? null,
    staleTime: 0,
  });
}
