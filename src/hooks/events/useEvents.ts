"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/error";
import { EVENT_QUERY_KEYS, EVENT_REFRESH_MS } from "@/constants/events";
import { notifyError, notifySuccess } from "@/lib/notify";
import { eventService, type EventListParams } from "@/services/events.service";
import { EMPTY_PAGE } from "@/types/paged";
import type { EventCreatePayload, EventUpdatePayload, RsvpChoice } from "@/types/event";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";

function apiErrorMessage(error: unknown, fallback: string): string {
  return toUserFriendlyApiErrorMessage(error, error instanceof ApiError ? error.message : fallback);
}

export function useEvents(params: EventListParams = {}) {
  return useQuery({
    queryKey: EVENT_QUERY_KEYS.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => (await eventService.list(params)).data ?? EMPTY_PAGE,
    staleTime: 30_000,
    refetchInterval: EVENT_REFRESH_MS,
    refetchOnWindowFocus: "always",
  });
}

export function useEventAttendees(id: number) {
  return useQuery({
    queryKey: EVENT_QUERY_KEYS.attendees(id),
    queryFn: async () => (await eventService.attendees(id)).data ?? null,
    staleTime: 10_000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EventCreatePayload) => eventService.create(payload),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.all });
      const invited = res.data?.invited_count;
      notifySuccess(invited != null ? `Event created — ${invited} ${invited === 1 ? "person" : "people"} invited.` : "Event created.");
    },
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't create that event.")),
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EventUpdatePayload }) => eventService.update(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.all }),
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't update that event.")),
  });
}

/** RSVP. The error from the server (event full, closed…) is shown as-is because it says exactly why. */
export function useRsvp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, response }: { id: number; response: RsvpChoice }) => eventService.rsvp(id, response),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.all }),
    onError: (error) => {
      notifyError(apiErrorMessage(error, "Couldn't save your answer."));
      void queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.all });
    },
  });
}
