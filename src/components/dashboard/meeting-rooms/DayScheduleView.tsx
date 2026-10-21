"use client";

import { useMemo, useState } from "react";

import { BookRoomDialog } from "@/components/dashboard/meeting-rooms/BookRoomDialog";
import { earliestFreeSlot, RoomTimeline } from "@/components/dashboard/meeting-rooms/RoomTimeline";
import { CONTENT_CARD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { TIMELINE_COPY, TIMELINE_SLOT_MINUTES } from "@/constants/meetingRooms";
import { useAuth } from "@/context/AuthContext";
import { useAllMeetingRoomBookings, useMeetingRoomsList } from "@/hooks/meeting-rooms/useMeetingRooms";
import { useNow } from "@/hooks/useNow";
import { cn } from "@/lib/utils";
import { formatApiDate } from "@/utils/apiDate";
import { addDays, bookingsOnDay, startOfDay } from "@/utils/meetingRoomSchedule";
import type { MeetingRoom, MeetingRoomBooking } from "@/types/meetingRoom";

const ROOM_ADMIN_ROLES = ["ROLE_OFFICE_ADMIN", "ROLE_HR", "ROLE_ADMIN"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toTimeInput(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The day's timeline of every room, plus a hint card for the earliest free slot. Booking and editing open the same dialogs as before. */
export function DayScheduleView({ day, children }: { day: Date; children?: React.ReactNode }) {
  const { user } = useAuth();
  const myEmail = (user?.email ?? "").toLowerCase();
  const now = useNow();
  // Transient UI state: the room being booked (with the clicked slot) and the booking being edited.
  const [booking, setBooking] = useState<{ room: MeetingRoom; slot: Date } | null>(null);
  const [editing, setEditing] = useState<MeetingRoomBooking | null>(null);
  const isRoomAdmin = (user?.roles ?? []).some((role) => ROOM_ADMIN_ROLES.includes(role));
  const canEdit = (b: MeetingRoomBooking) => isRoomAdmin || b.booked_by.email.toLowerCase() === myEmail;

  const roomsQ = useMeetingRoomsList();
  const rooms = useMemo(() => roomsQ.data ?? [], [roomsQ.data]);
  const dayStart = startOfDay(day);
  const bookingsQ = useAllMeetingRoomBookings(null, dayStart.toISOString(), addDays(dayStart, 1).toISOString());
  const allBookings = useMemo(() => bookingsQ.data ?? [], [bookingsQ.data]);

  const bookingsByRoom = useMemo(() => {
    const map = new Map<number, ReturnType<typeof bookingsOnDay>>();
    for (const room of rooms) map.set(room.id, bookingsOnDay(allBookings.filter((b) => b.room_id === room.id), day));
    return map;
  }, [rooms, allBookings, day]);
  const free = useMemo(() => earliestFreeSlot(rooms, bookingsByRoom, day, now), [rooms, bookingsByRoom, day, now]);
  const editingRoom = editing ? rooms.find((r) => r.id === editing.room_id) : undefined;
  const slotEnd = booking ? new Date(booking.slot.getTime() + TIMELINE_SLOT_MINUTES * 60_000) : null;

  return (
    <div className="space-y-6">
      <div className={cn(CONTENT_CARD_CLASS, "p-5 sm:p-6")}>
        {roomsQ.isLoading ? (
          <p className="text-sm text-wt-text-muted">Loading rooms…</p>
        ) : rooms.length === 0 ? (
          <div className="p-6 text-center">
            <p className="font-medium text-wt-text">No meeting rooms yet</p>
            <p className="mt-1 text-sm text-wt-text-muted">An admin needs to register a room before anyone can book one.</p>
          </div>
        ) : (
          <RoomTimeline rooms={rooms} bookingsByRoom={bookingsByRoom} day={day} now={now} myEmail={myEmail} canEdit={canEdit} onBook={(room, slot) => setBooking({ room, slot })} onEdit={setEditing} />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className={cn(CONTENT_CARD_CLASS, "p-5 sm:p-6")}>
          <h3 className="text-lg font-bold tracking-tight text-wt-text">{TIMELINE_COPY.bookTitle}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-wt-text-muted">
            {TIMELINE_COPY.bookHint}{" "}
            {free
              ? TIMELINE_COPY.earliest(free.room.name, free.slot.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }))
              : rooms.length > 0
                ? TIMELINE_COPY.noneFree
                : ""}
          </p>
        </section>
        {children}
      </div>

      {editing && editingRoom ? <BookRoomDialog room={editingRoom} booking={editing} onClose={() => setEditing(null)} /> : null}
      {booking ? (
        <BookRoomDialog
          room={booking.room}
          defaultDate={formatApiDate(day)}
          defaultStartTime={toTimeInput(booking.slot)}
          defaultEndTime={slotEnd ? toTimeInput(slotEnd) : undefined}
          onClose={() => setBooking(null)}
        />
      ) : null}
    </div>
  );
}
