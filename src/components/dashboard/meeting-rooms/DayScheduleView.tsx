"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { BookRoomDialog } from "@/components/dashboard/meeting-rooms/BookRoomDialog";
import { MeetingSlideCard } from "@/components/dashboard/meeting-rooms/MeetingSlideCard";
import { RoomCard } from "@/components/dashboard/meeting-rooms/RoomCard";
import { CONTENT_CARD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlideGallery } from "@/components/ui/SlideGallery";
import { useAuth } from "@/context/AuthContext";
import { useAllMeetingRoomBookings, useMeetingRoomsList } from "@/hooks/meeting-rooms/useMeetingRooms";
import { useNow } from "@/hooks/useNow";
import { cn } from "@/lib/utils";
import { formatApiDate } from "@/utils/apiDate";
import { addDays, bookingsOnDay, sameDay, startOfDay, startOfWeek } from "@/utils/meetingRoomSchedule";
import type { MeetingRoom, MeetingRoomBooking } from "@/types/meetingRoom";

const ROOM_ADMIN_ROLES = ["ROLE_OFFICE_ADMIN", "ROLE_HR", "ROLE_ADMIN"];
const SUGGESTED_MEETING_MINUTES = 30;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toTimeInput(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function DayStrip({
  days,
  selected,
  today,
  countFor,
  onSelect,
}: {
  days: Date[];
  selected: Date;
  today: Date;
  countFor: (day: Date) => number;
  onSelect: (day: Date) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="tablist" aria-label="Day of the week">
      {days.map((day) => {
        const isSelected = sameDay(day, selected);
        const isToday = sameDay(day, today);
        const count = countFor(day);
        return (
          <button
            key={day.toISOString()}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(day)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl border px-1 py-2.5 text-center transition-colors",
              isSelected
                ? "border-[var(--wt-brand)] bg-[var(--wt-brand)] text-white shadow-sm"
                : "border-wt-border bg-wt-surface-1 text-wt-text hover:bg-wt-surface-2",
              !isSelected && isToday && "border-[var(--wt-brand)]"
            )}
          >
            <span className={cn("text-[11px] font-medium uppercase tracking-wide", isSelected ? "text-white/80" : "text-wt-text-muted")}>
              {day.toLocaleDateString("en-IN", { weekday: "short" })}
            </span>
            <span className="text-lg font-semibold leading-none tabular-nums">{day.getDate()}</span>
            <span
              className={cn(
                "mt-0.5 min-w-5 rounded-full px-1.5 text-[10px] font-medium tabular-nums",
                count === 0
                  ? isSelected
                    ? "text-white/60"
                    : "text-wt-text-faint"
                  : isSelected
                    ? "bg-white/25 text-white"
                    : "bg-wt-surface-2 text-wt-text-muted"
              )}
            >
              {count === 0 ? "free" : count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
      <h3 className="text-sm font-semibold text-wt-text">{title}</h3>
      {hint ? <p className="text-xs text-wt-text-muted">{hint}</p> : null}
    </div>
  );
}

/** Day-wise shared schedule: pick a day, browse every room and every meeting in swipeable galleries, book from either. */
export function DayScheduleView() {
  const { user } = useAuth();
  const myEmail = (user?.email ?? "").toLowerCase();
  const now = useNow();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [selected, setSelected] = useState<Date>(today);
  const [roomFilter, setRoomFilter] = useState<number | null>(null);
  // Transient UI state: the room being booked (with an optional suggested slot) and the booking being edited.
  const [booking, setBooking] = useState<{ room: MeetingRoom; slot: Date | null } | null>(null);
  const [editing, setEditing] = useState<MeetingRoomBooking | null>(null);
  // The owner may edit a booking; so may a room admin (Office Admin / HR / Admin).
  const isRoomAdmin = (user?.roles ?? []).some((role) => ROOM_ADMIN_ROLES.includes(role));
  const canEdit = (b: MeetingRoomBooking) => isRoomAdmin || b.booked_by.email.toLowerCase() === myEmail;

  const roomsQ = useMeetingRoomsList();
  const rooms = roomsQ.data ?? [];
  const editingRoom = editing ? rooms.find((r) => r.id === editing.room_id) : undefined;

  const weekStart = startOfWeek(selected);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const bookingsQ = useAllMeetingRoomBookings(null, weekStart.toISOString(), addDays(weekStart, 7).toISOString());
  const allBookings = bookingsQ.data ?? [];

  const visibleRooms = roomFilter == null ? rooms : rooms.filter((r) => r.id === roomFilter);
  const visibleBookings = allBookings.filter((b) => roomFilter == null || b.room_id === roomFilter);
  const isPast = selected.getTime() < today.getTime();
  const isToday = sameDay(selected, today);
  const dayMeetings = bookingsOnDay(visibleBookings, selected);
  // Today: what's on now and still to come first, finished meetings after — so the gallery opens on what matters.
  const meetings = isToday
    ? [...dayMeetings.filter((i) => i.end.getTime() > now.getTime()), ...dayMeetings.filter((i) => i.end.getTime() <= now.getTime())]
    : dayMeetings;
  const roomsWithMeetings = new Set(meetings.map((i) => i.booking.room_id)).size;

  const heading = selected.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const slotEnd = booking?.slot ? new Date(booking.slot.getTime() + SUGGESTED_MEETING_MINUTES * 60_000) : null;

  return (
    <div className="space-y-5">
      <div className={cn(CONTENT_CARD_CLASS, "space-y-5 p-4 sm:p-6")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-wt-text">
              {heading}
              {isToday ? <Badge className="ml-2 align-middle">Today</Badge> : null}
            </h2>
            <p className="mt-0.5 text-sm text-wt-text-muted">
              {bookingsQ.isLoading
                ? "Loading bookings…"
                : meetings.length === 0
                  ? "No bookings — every room is free."
                  : `${meetings.length} booking${meetings.length === 1 ? "" : "s"} across ${roomsWithMeetings} room${roomsWithMeetings === 1 ? "" : "s"}.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSelected(addDays(selected, -7))} aria-label="Previous week">
              <ChevronLeft className="size-4" /> Week
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setSelected(today)} disabled={isToday}>
              Today
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setSelected(addDays(selected, 7))} aria-label="Next week">
              Week <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <DayStrip
          days={weekDays}
          selected={selected}
          today={today}
          countFor={(day) => bookingsOnDay(visibleBookings, day).length}
          onSelect={setSelected}
        />

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by room">
          <span className="text-xs font-medium uppercase tracking-wide text-wt-text-muted">Room</span>
          {[{ id: null as number | null, name: "All rooms" }, ...rooms].map((r) => (
            <button
              key={r.id ?? "all"}
              type="button"
              onClick={() => setRoomFilter(r.id)}
              aria-pressed={roomFilter === r.id}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                roomFilter === r.id
                  ? "border-[var(--wt-brand)] bg-[var(--wt-brand)] text-white"
                  : "border-wt-border bg-wt-surface-1 text-wt-text-muted hover:bg-wt-surface-2"
              )}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      {roomsQ.isLoading ? (
        <p className="px-1 text-sm text-wt-text-muted">Loading rooms…</p>
      ) : visibleRooms.length === 0 ? (
        <div className={cn(CONTENT_CARD_CLASS, "p-8 text-center")}>
          <p className="font-medium text-wt-text">No meeting rooms yet</p>
          <p className="mt-1 text-sm text-wt-text-muted">An admin needs to register a room before anyone can book one.</p>
        </div>
      ) : (
        <>
          <section className="space-y-2">
            <SectionHeading title="Rooms" hint={isToday ? "Live availability — swipe to see every room" : "Swipe to see every room"} />
            <SlideGallery label="Rooms" slideClassName="w-[min(92%,24rem)]">
              {visibleRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  items={bookingsOnDay(allBookings.filter((b) => b.room_id === room.id), selected)}
                  day={selected}
                  now={now}
                  myEmail={myEmail}
                  isPast={isPast}
                  onBook={(r, slot) => setBooking({ room: r, slot })}
                  canEdit={canEdit}
                  onEdit={setEditing}
                />
              ))}
            </SlideGallery>
          </section>

          {meetings.length > 0 ? (
            <section className="space-y-2">
              <SectionHeading title="Meetings" hint={`${meetings.length} on ${isToday ? "today" : heading}`} />
              <SlideGallery label="Meetings" slideClassName="w-[min(88%,19rem)]">
                {meetings.map((item) => (
                  <MeetingSlideCard
                    key={item.booking.id}
                    item={item}
                    now={now}
                    mine={myEmail !== "" && item.booking.booked_by.email.toLowerCase() === myEmail}
                    onEdit={canEdit(item.booking) && item.end.getTime() > now.getTime() ? setEditing : undefined}
                  />
                ))}
              </SlideGallery>
            </section>
          ) : null}
        </>
      )}

      {editing && editingRoom ? <BookRoomDialog room={editingRoom} booking={editing} onClose={() => setEditing(null)} /> : null}
      {booking ? (
        <BookRoomDialog
          room={booking.room}
          defaultDate={formatApiDate(selected)}
          defaultStartTime={booking.slot ? toTimeInput(booking.slot) : undefined}
          defaultEndTime={slotEnd ? toTimeInput(slotEnd) : undefined}
          onClose={() => setBooking(null)}
        />
      ) : null}
    </div>
  );
}
