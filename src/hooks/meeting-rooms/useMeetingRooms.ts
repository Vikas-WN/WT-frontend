"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hrmsService } from "@/services/hrms.service";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { ApiError } from "@/api/error";
import type {
  MeetingRoomBookingCreatePayload,
  MeetingRoomCreatePayload,
  MeetingRoomUpdatePayload,
} from "@/types/meetingRoom";

export const MEETING_ROOM_QUERY_KEYS = {
  rooms: (includeInactive: boolean) => ["meeting-rooms", "rooms", includeInactive] as const,
  bookings: (roomId: number | null, from?: string, to?: string) =>
    ["meeting-rooms", "bookings", roomId, from ?? null, to ?? null] as const,
  mine: (upcomingOnly: boolean) => ["meeting-rooms", "mine", upcomingOnly] as const,
};

function apiErrorMessage(error: unknown, fallback: string): string {
  return toUserFriendlyApiErrorMessage(error, error instanceof ApiError ? error.message : fallback);
}

/** Active rooms are visible to everyone (needed to book one); pass
 *  includeInactive for the admin "manage rooms" view. */
export function useMeetingRoomsList(includeInactive = false) {
  return useQuery({
    queryKey: MEETING_ROOM_QUERY_KEYS.rooms(includeInactive),
    queryFn: async () => {
      const res = await hrmsService.listMeetingRooms(includeInactive);
      return res.data ?? [];
    },
    staleTime: 60_000,
  });
}

/** A room's bookings in a time window — renders its availability before booking. */
export function useMeetingRoomBookings(roomId: number | null, from?: string, to?: string) {
  return useQuery({
    queryKey: MEETING_ROOM_QUERY_KEYS.bookings(roomId, from, to),
    enabled: roomId != null,
    queryFn: async () => {
      const res = await hrmsService.getMeetingRoomBookings(roomId as number, { from, to });
      return res.data ?? [];
    },
    staleTime: 15_000,
  });
}

export function useMyMeetingRoomBookings(upcomingOnly = false) {
  return useQuery({
    queryKey: MEETING_ROOM_QUERY_KEYS.mine(upcomingOnly),
    queryFn: async () => {
      const res = await hrmsService.getMyMeetingRoomBookings(upcomingOnly);
      return res.data ?? [];
    },
    staleTime: 15_000,
  });
}

function useInvalidateMeetingRoomQueries() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["meeting-rooms"] });
  };
}

export function useCreateMeetingRoom() {
  const invalidate = useInvalidateMeetingRoomQueries();
  return useMutation({
    mutationFn: (payload: MeetingRoomCreatePayload) => hrmsService.createMeetingRoom(payload),
    onSuccess: (res) => {
      invalidate();
      notifySuccess(`'${res.data?.name}' is ready to book.`);
    },
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't create the meeting room.")),
  });
}

export function useUpdateMeetingRoom() {
  const invalidate = useInvalidateMeetingRoomQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MeetingRoomUpdatePayload }) =>
      hrmsService.updateMeetingRoom(id, payload),
    onSuccess: () => {
      invalidate();
      notifySuccess("Meeting room updated.");
    },
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't update the meeting room.")),
  });
}

export function useDeactivateMeetingRoom() {
  const invalidate = useInvalidateMeetingRoomQueries();
  return useMutation({
    mutationFn: (id: number) => hrmsService.deactivateMeetingRoom(id),
    onSuccess: () => {
      invalidate();
      notifySuccess("Meeting room deactivated.");
    },
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't deactivate the meeting room.")),
  });
}

export function useCreateMeetingRoomBooking() {
  const invalidate = useInvalidateMeetingRoomQueries();
  return useMutation({
    mutationFn: (payload: MeetingRoomBookingCreatePayload) => hrmsService.createMeetingRoomBooking(payload),
    onSuccess: (res) => {
      invalidate();
      notifySuccess(`Booked '${res.data?.room_name}' for ${res.data?.title}.`);
    },
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't book that room.")),
  });
}

export function useCancelMeetingRoomBooking() {
  const invalidate = useInvalidateMeetingRoomQueries();
  return useMutation({
    mutationFn: (id: number) => hrmsService.cancelMeetingRoomBooking(id),
    onSuccess: () => {
      invalidate();
      notifySuccess("Booking cancelled.");
    },
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't cancel that booking.")),
  });
}
