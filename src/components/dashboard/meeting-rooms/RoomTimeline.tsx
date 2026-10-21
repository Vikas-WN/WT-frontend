"use client";

import { useMemo } from "react";

import { TIMELINE_COPY, TIMELINE_END_HOUR, TIMELINE_SLOT_MINUTES, TIMELINE_START_HOUR } from "@/constants/meetingRooms";
import { cn } from "@/lib/utils";
import type { DayBooking } from "@/utils/meetingRoomSchedule";
import { startOfDay } from "@/utils/meetingRoomSchedule";
import type { MeetingRoom, MeetingRoomBooking } from "@/types/meetingRoom";

const SLOTS_PER_HOUR = 60 / TIMELINE_SLOT_MINUTES;
const SLOT_COUNT = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * SLOTS_PER_HOUR;
const SLOT_MS = TIMELINE_SLOT_MINUTES * 60_000;

function hourLabel(hour: number): string {
  const suffix = hour >= 12 ? "p" : "a";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${suffix}`;
}

export type FreeSlot = { room: MeetingRoom; slot: Date };

/** The first free half-hour still ahead of `now` in any room, for the "Book" hint. */
export function earliestFreeSlot(rooms: readonly MeetingRoom[], byRoom: ReadonlyMap<number, DayBooking[]>, day: Date, now: Date): FreeSlot | null {
  const dayStart = startOfDay(day).getTime() + TIMELINE_START_HOUR * 3_600_000;
  for (let i = 0; i < SLOT_COUNT; i += 1) {
    const slotStart = dayStart + i * SLOT_MS;
    if (slotStart + SLOT_MS <= now.getTime()) continue;
    for (const room of rooms) {
      const taken = (byRoom.get(room.id) ?? []).some((b) => b.start.getTime() < slotStart + SLOT_MS && b.end.getTime() > slotStart);
      if (!taken) return { room, slot: new Date(slotStart) };
    }
  }
  return null;
}

/** Rooms down the side, half-hour slots across: free slots book, your own meetings edit, the red line is now. */
export function RoomTimeline({
  rooms,
  bookingsByRoom,
  day,
  now,
  myEmail,
  canEdit,
  onBook,
  onEdit,
}: {
  rooms: readonly MeetingRoom[];
  bookingsByRoom: ReadonlyMap<number, DayBooking[]>;
  day: Date;
  now: Date;
  myEmail: string;
  canEdit: (booking: MeetingRoomBooking) => boolean;
  onBook: (room: MeetingRoom, slot: Date) => void;
  onEdit: (booking: MeetingRoomBooking) => void;
}) {
  const dayStart = startOfDay(day).getTime() + TIMELINE_START_HOUR * 3_600_000;
  const nowFraction = (now.getTime() - dayStart) / (SLOT_COUNT * SLOT_MS);
  const showNow = nowFraction > 0 && nowFraction < 1;
  const hours = useMemo(() => Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR }, (_, i) => TIMELINE_START_HOUR + i), []);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-x-4">
          <span aria-hidden />
          <div className="grid pb-2 text-sm text-wt-text-muted" style={{ gridTemplateColumns: `repeat(${hours.length}, minmax(0, 1fr))` }}>
            {hours.map((h) => (
              <span key={h}>{hourLabel(h)}</span>
            ))}
          </div>
          {rooms.map((room) => {
            const items = bookingsByRoom.get(room.id) ?? [];
            const inUse = items.some((b) => b.start.getTime() <= now.getTime() && b.end.getTime() > now.getTime());
            return (
              <div key={room.id} className="contents">
                <div className="py-1.5">
                  <p className="truncate font-semibold text-wt-text">{room.name}</p>
                  <p className={cn("flex items-center gap-1.5 text-sm", inUse ? "text-amber-700" : "text-emerald-700")}>
                    <span className={cn("size-1.5 rounded-full", inUse ? "bg-amber-600" : "bg-emerald-600")} aria-hidden />
                    {inUse ? TIMELINE_COPY.inUse : TIMELINE_COPY.freeNow}
                  </p>
                </div>
                <div className="relative py-1.5">
                  <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${SLOT_COUNT}, minmax(0, 1fr))` }}>
                    {Array.from({ length: SLOT_COUNT }, (_, i) => {
                      const start = dayStart + i * SLOT_MS;
                      const booking = items.find((b) => b.start.getTime() < start + SLOT_MS && b.end.getTime() > start);
                      const past = start + SLOT_MS <= now.getTime();
                      if (booking) {
                        const mine = myEmail !== "" && booking.booking.booked_by.email.toLowerCase() === myEmail;
                        const editable = canEdit(booking.booking) && booking.end.getTime() > now.getTime();
                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={!editable}
                            onClick={() => onEdit(booking.booking)}
                            title={`${booking.booking.title} · ${booking.booking.booked_by.name}`}
                            aria-label={`${booking.booking.title}, ${room.name}`}
                            className={cn("h-10 rounded-md", mine ? "bg-[var(--wt-brand)]" : "bg-amber-400/70", editable ? "cursor-pointer hover:opacity-80" : "cursor-default")}
                          />
                        );
                      }
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={past}
                          onClick={() => onBook(room, new Date(start))}
                          aria-label={`${TIMELINE_COPY.bookSlot} ${room.name} ${new Date(start).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`}
                          className={cn(
                            "h-10 rounded-md",
                            past ? "cursor-default bg-[repeating-linear-gradient(135deg,var(--wt-surface-3)_0_3px,transparent_3px_6px)] opacity-70" : "bg-wt-surface-3 hover:bg-[var(--wt-brand-soft)] hover:ring-1 hover:ring-[var(--wt-brand)]"
                          )}
                        />
                      );
                    })}
                  </div>
                  {showNow ? <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-red-500" style={{ left: `${nowFraction * 100}%` }} aria-hidden /> : null}
                </div>
              </div>
            );
          })}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-wt-border pt-3 text-sm text-wt-text-muted" aria-label="Legend">
          <li className="flex items-center gap-2"><span className="size-3.5 rounded bg-wt-surface-3" aria-hidden />{TIMELINE_COPY.legendFree}</li>
          <li className="flex items-center gap-2"><span className="size-3.5 rounded bg-amber-400/70" aria-hidden />{TIMELINE_COPY.legendBooked}</li>
          <li className="flex items-center gap-2"><span className="size-3.5 rounded bg-[var(--wt-brand)]" aria-hidden />{TIMELINE_COPY.legendMine}</li>
          <li className="flex items-center gap-2"><span className="size-3.5 rounded bg-[repeating-linear-gradient(135deg,var(--wt-surface-3)_0_3px,transparent_3px_6px)]" aria-hidden />{TIMELINE_COPY.legendPast}</li>
        </ul>
      </div>
    </div>
  );
}
