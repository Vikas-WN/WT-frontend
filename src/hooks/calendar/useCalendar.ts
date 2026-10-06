"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CALENDAR_COPY, CALENDAR_QUERY_KEYS } from "@/constants/calendar";
import { notifyError, notifySuccess } from "@/lib/notify";
import { calendarService } from "@/services/calendar.service";
import { downloadBlob } from "@/utils/downloadBlob";

/** The signed-in person's calendar subscription links. Only fetched while the sync dialog is open. */
export function useCalendarFeed(enabled = true) {
  return useQuery({
    queryKey: CALENDAR_QUERY_KEYS.feed,
    enabled,
    queryFn: async () => (await calendarService.feedInfo()).data ?? null,
    staleTime: 5 * 60_000,
  });
}

export function useRegenerateCalendarFeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => calendarService.regenerate(),
    onSuccess: (res) => {
      queryClient.setQueryData(CALENDAR_QUERY_KEYS.feed, res.data ?? null);
      notifySuccess(CALENDAR_COPY.regenerated);
    },
    onError: () => notifyError(CALENDAR_COPY.loadError),
  });
}

export function useDownloadEventIcs() {
  return useMutation({
    mutationFn: async (eventId: number) => {
      const blob = await calendarService.eventIcs(eventId);
      downloadBlob(blob, `event-${eventId}.ics`);
    },
    onError: () => notifyError(CALENDAR_COPY.icsError),
  });
}
