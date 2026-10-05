"use client";

import { CalendarClock, MapPin, Users } from "lucide-react";

import { RoomAvailabilityBar, dayWindow } from "@/components/dashboard/meeting-rooms/RoomAvailabilityBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { cn } from "@/lib/utils";
import type { MeetingRoom, MeetingRoomBooking } from "@/types/meetingRoom";
import {
  formatClock,
  nextFreeSlot,
  noSlotReason,
  roomStatus,
  sameDay,
  type DayBooking,
  type RoomStatusKind,
} from "@/utils/meetingRoomSchedule";

const STATUS_TONE: Record<RoomStatusKind, keyof typeof import("@/components/dashboard/ui/badgeTones").BADGE_TONE> = {
  free: "success",
  "in-use": "warning",
  "busy-day": "info",
  past: "neutral",
};

const VISIBLE_BOOKINGS = 3;

/** One room as a gallery slide: live status, the day's timeline, the next bookings, and a one-tap Book. */
const NO_SLOT_COPY = {
  "after-hours": "Booking hours are over today",
  "fully-booked": "Fully booked today",
} as const;

export function RoomCard({
  room,
  items,
  day,
  now,
  myEmail,
  isPast,
  onBook,
  canEdit,
  onEdit,
}: {
  room: MeetingRoom;
  items: DayBooking[];
  day: Date;
  now: Date;
  myEmail: string;
  isPast: boolean;
  /** `slot` is the suggested start (next free half hour), when there is one. */
  onBook: (room: MeetingRoom, slot: Date | null) => void;
  canEdit: (booking: MeetingRoomBooking) => boolean;
  onEdit: (booking: MeetingRoomBooking) => void;
}) {
  const status = roomStatus(items, day, now);
  const slot = isPast ? null : nextFreeSlot(items, day, now);
  const { startHour, endHour } = dayWindow(items, day);
  const today = sameDay(day, now);
  const upcoming = today ? items.filter((i) => i.end.getTime() > now.getTime()) : items;
  const shown = upcoming.slice(0, VISIBLE_BOOKINGS);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-wt-border bg-wt-surface-1 p-4 shadow-[var(--wt-shadow-sm)] transition-shadow hover:shadow-[var(--wt-shadow-md)] sm:p-5">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-wt-text">{room.name}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-wt-text-muted">
            {room.location ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden /> {room.location}
              </span>
            ) : null}
            {room.capacity ? (
              <span className="flex items-center gap-1">
                <Users className="size-3.5" aria-hidden /> Seats {room.capacity}
              </span>
            ) : null}
          </p>
        </div>
        <Badge variant="secondary" className={cn("shrink-0", filledBadgeClass(STATUS_TONE[status.kind]))}>
          {status.label}
        </Badge>
      </header>

      {room.amenities ? <p className="mt-2 line-clamp-1 text-xs text-wt-text-faint">{room.amenities}</p> : null}
      {status.detail ? <p className="mt-2 truncate text-xs text-wt-text-muted">{status.detail}</p> : null}

      <div className="mt-3">
        <RoomAvailabilityBar
          items={items}
          day={day}
          startHour={startHour}
          endHour={endHour}
          myEmail={myEmail}
          nowMs={today ? now.getTime() : undefined}
        />
      </div>

      <ul className="mt-3 min-h-[3.75rem] space-y-1.5">
        {shown.map(({ booking, start, end }) => {
          const mine = myEmail !== "" && booking.booked_by.email.toLowerCase() === myEmail;
          return (
            <li key={booking.id} className="flex items-center gap-2 text-xs">
              <span className="w-[8.5rem] shrink-0 tabular-nums text-wt-text-muted">
                {formatClock(start)} – {formatClock(end)}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-wt-text">
                {booking.title}
                <span className="font-normal text-wt-text-muted"> · {mine ? "You" : booking.booked_by.name}</span>
              </span>
              {canEdit(booking) && end.getTime() > now.getTime() ? (
                <button type="button" onClick={() => onEdit(booking)} className="shrink-0 text-[11px] font-medium text-[var(--wt-brand)] hover:underline">
                  Edit
                </button>
              ) : null}
            </li>
          );
        })}
        {upcoming.length > shown.length ? (
          <li className="text-xs text-wt-text-faint">+{upcoming.length - shown.length} more</li>
        ) : null}
        {upcoming.length === 0 ? <li className="text-xs text-wt-text-faint">{isPast ? "No bookings that day." : "Nothing else booked."}</li> : null}
      </ul>

      {!isPast ? (
        <footer className="mt-auto flex items-center justify-between gap-3 pt-4">
          <p className="min-w-0 truncate text-xs text-wt-text-muted">
            {slot ? (
              <>
                Next free <span className="font-semibold text-wt-text">{formatClock(slot)}</span>
              </>
            ) : (
              NO_SLOT_COPY[noSlotReason(day, now)]
            )}
          </p>
          <Button type="button" variant="brand" size="sm" onClick={() => onBook(room, slot)}>
            <CalendarClock className="size-4" /> Book
          </Button>
        </footer>
      ) : null}
    </article>
  );
}
