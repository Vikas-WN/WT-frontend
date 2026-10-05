"use client";

import { useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, MapPin, StickyNote, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CONTENT_CARD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { useAuth } from "@/context/AuthContext";
import { useAllMeetingRoomBookings, useMeetingRoomsList } from "@/hooks/meeting-rooms/useMeetingRooms";
import { BookRoomDialog } from "@/components/dashboard/meeting-rooms/BookRoomDialog";
import { cn } from "@/lib/utils";
import { formatApiDate } from "@/utils/apiDate";
import type { MeetingRoom, MeetingRoomBooking } from "@/types/meetingRoom";

const ROOM_ADMIN_ROLES = ["ROLE_OFFICE_ADMIN", "ROLE_HR", "ROLE_ADMIN"];
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 20;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday of the week containing `date`. */
function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** API date-times are `dd/mm/yyyy HH:MM[:SS]` in the app timezone. */
function parseBookingTime(value: string): Date {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value.trim());
  if (!m) return new Date(NaN);
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0));
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
}

function formatHour(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 || hour === 24 ? "a" : "p"}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

type DayBooking = {
  booking: MeetingRoomBooking;
  start: Date;
  end: Date;
};

/** Bookings that overlap `day`, with times parsed once. */
function bookingsOnDay(bookings: MeetingRoomBooking[], day: Date): DayBooking[] {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + DAY_MS;
  return bookings
    .map((booking) => ({ booking, start: parseBookingTime(booking.start_time), end: parseBookingTime(booking.end_time) }))
    .filter(({ start, end }) => !Number.isNaN(start.getTime()) && start.getTime() < dayEnd && end.getTime() > dayStart)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
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

/** A horizontal bar of the day: booked stretches are filled, the rest is free. */
function AvailabilityBar({
  items,
  day,
  startHour,
  endHour,
  myEmail,
}: {
  items: DayBooking[];
  day: Date;
  startHour: number;
  endHour: number;
  myEmail: string;
}) {
  const dayStart = startOfDay(day).getTime();
  const winStart = dayStart + startHour * 3_600_000;
  const winEnd = dayStart + endHour * 3_600_000;
  const span = winEnd - winStart;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  return (
    <div>
      <div className="relative h-7 overflow-hidden rounded-lg bg-wt-surface-2">
        {hours.slice(1, -1).map((h) => (
          <div
            key={h}
            className="absolute inset-y-0 w-px bg-wt-border/70"
            style={{ left: `${((h - startHour) / (endHour - startHour)) * 100}%` }}
          />
        ))}
        {items.map(({ booking, start, end }) => {
          const left = Math.max(0, (start.getTime() - winStart) / span) * 100;
          const right = Math.min(1, (end.getTime() - winStart) / span) * 100;
          const mine = myEmail !== "" && booking.booked_by.email.toLowerCase() === myEmail;
          return (
            <div
              key={booking.id}
              title={`${formatClock(start)} – ${formatClock(end)} · ${booking.title} · ${booking.booked_by.name}`}
              className="absolute inset-y-1 rounded-md"
              style={{
                left: `${left}%`,
                width: `${Math.max(right - left, 0.8)}%`,
                background: mine ? "var(--wt-brand)" : "color-mix(in srgb, var(--wt-brand) 45%, transparent)",
              }}
            />
          );
        })}
      </div>
      <div className="relative mt-1 h-3.5 text-[10px] tabular-nums text-wt-text-faint">
        {hours.map((h, i) =>
          i % 2 === 0 ? (
            <span
              key={h}
              className="absolute -translate-x-1/2 first:translate-x-0 last:translate-x-[-100%]"
              style={{ left: `${((h - startHour) / (endHour - startHour)) * 100}%` }}
            >
              {formatHour(h)}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}

function BookingItem({ item, mine, onEdit }: { item: DayBooking; mine: boolean; onEdit?: () => void }) {
  const { booking, start, end } = item;
  const sub = [booking.booked_by.emp_id, booking.booked_by.email].filter(Boolean).join(" · ");
  return (
    <li className="flex gap-3 rounded-xl border border-wt-border bg-wt-surface-1 p-3 sm:gap-4 sm:p-4">
      <div className="w-24 shrink-0 text-sm tabular-nums sm:w-32">
        <p className="font-semibold text-wt-text">{formatClock(start)}</p>
        <p className="text-wt-text-muted">to {formatClock(end)}</p>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-wt-text">
          {booking.title}
          {mine ? <Badge variant="outline">Your booking</Badge> : null}
          {onEdit ? (
            <Button type="button" variant="outline" size="xs" className="ml-auto" onClick={onEdit}>
              Edit
            </Button>
          ) : null}
        </p>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-wt-surface-2 text-[11px] font-semibold text-wt-text-muted"
          >
            {initials(booking.booked_by.name)}
          </span>
          <div className="min-w-0 text-xs">
            <p className="truncate font-medium text-wt-text">{booking.booked_by.name}</p>
            {sub ? <p className="truncate text-wt-text-muted">{sub}</p> : null}
          </div>
        </div>
        {booking.attendees ? (
          <p className="flex items-start gap-1.5 text-xs text-wt-text-muted">
            <Users className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span className="whitespace-pre-wrap break-words">{booking.attendees}</span>
          </p>
        ) : null}
        {booking.notes ? (
          <p className="flex items-start gap-1.5 text-xs text-wt-text-muted">
            <StickyNote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span className="whitespace-pre-wrap break-words">{booking.notes}</span>
          </p>
        ) : null}
      </div>
    </li>
  );
}

function RoomDayPanel({
  room,
  items,
  day,
  isPast,
  myEmail,
  onBook,
  canEdit,
  onEdit,
}: {
  room: MeetingRoom;
  items: DayBooking[];
  day: Date;
  isPast: boolean;
  myEmail: string;
  onBook: () => void;
  canEdit: (booking: MeetingRoomBooking) => boolean;
  onEdit: (booking: MeetingRoomBooking) => void;
}) {
  // Read the clock once per mount (render must stay pure): finished meetings can't be edited.
  const [nowMs] = useState(() => Date.now());
  const dayStart = startOfDay(day).getTime();
  const startHour = Math.min(
    DEFAULT_START_HOUR,
    ...items.map((i) => Math.max(0, Math.floor((i.start.getTime() - dayStart) / 3_600_000)))
  );
  const endHour = Math.max(
    DEFAULT_END_HOUR,
    ...items.map((i) => Math.min(24, Math.ceil((i.end.getTime() - dayStart) / 3_600_000)))
  );

  return (
    <section className={cn(CONTENT_CARD_CLASS, "space-y-4 p-4 sm:p-6")}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-wt-text">{room.name}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-wt-text-muted">
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
            {room.amenities ? <span className="truncate">{room.amenities}</span> : null}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={items.length === 0 ? "outline" : "default"}>
            {items.length === 0 ? "Free all day" : `${items.length} booking${items.length === 1 ? "" : "s"}`}
          </Badge>
          {!isPast ? (
            <Button type="button" variant="brand" size="sm" onClick={onBook}>
              <CalendarClock className="size-4" /> Book
            </Button>
          ) : null}
        </div>
      </header>

      <AvailabilityBar items={items} day={day} startHour={startHour} endHour={endHour} myEmail={myEmail} />

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <BookingItem
              key={item.booking.id}
              item={item}
              mine={myEmail !== "" && item.booking.booked_by.email.toLowerCase() === myEmail}
              onEdit={canEdit(item.booking) && item.end.getTime() > nowMs ? () => onEdit(item.booking) : undefined}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Day-wise shared schedule: pick a day, see every room and who booked it when. */
export function DayScheduleView() {
  const { user } = useAuth();
  const myEmail = (user?.email ?? "").toLowerCase();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [selected, setSelected] = useState<Date>(today);
  const [roomFilter, setRoomFilter] = useState<number | null>(null);
  const [bookingRoom, setBookingRoom] = useState<MeetingRoom | null>(null);
  // Transient UI state: the booking whose edit dialog is open.
  const [editing, setEditing] = useState<MeetingRoomBooking | null>(null);
  // The owner may edit a booking; so may a room admin (Office Admin / HR / Admin).
  const isRoomAdmin = (user?.roles ?? []).some((role) => ROOM_ADMIN_ROLES.includes(role));
  const canEdit = (booking: MeetingRoomBooking) => isRoomAdmin || booking.booked_by.email.toLowerCase() === myEmail;

  const roomsQ = useMeetingRoomsList();
  const rooms = roomsQ.data ?? [];
  const editingRoom = editing ? rooms.find((r) => r.id === editing.room_id) : undefined;

  const weekStart = startOfWeek(selected);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekFrom = weekStart.toISOString();
  const weekTo = addDays(weekStart, 7).toISOString();
  const bookingsQ = useAllMeetingRoomBookings(null, weekFrom, weekTo);
  const allBookings = bookingsQ.data ?? [];

  const visibleRooms = roomFilter == null ? rooms : rooms.filter((r) => r.id === roomFilter);
  const visibleBookings = allBookings.filter((b) => roomFilter == null || b.room_id === roomFilter);
  const isPast = selected.getTime() < today.getTime();
  const isToday = sameDay(selected, today);

  const heading = selected.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dayTotal = bookingsOnDay(visibleBookings, selected).length;

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
                : dayTotal === 0
                  ? "No bookings — every room is free."
                  : `${dayTotal} booking${dayTotal === 1 ? "" : "s"} across ${new Set(bookingsOnDay(visibleBookings, selected).map((i) => i.booking.room_id)).size} room(s).`}
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
        <div className="space-y-4">
          {visibleRooms.map((room) => (
            <RoomDayPanel
              key={room.id}
              room={room}
              items={bookingsOnDay(
                allBookings.filter((b) => b.room_id === room.id),
                selected
              )}
              day={selected}
              isPast={isPast}
              myEmail={myEmail}
              onBook={() => setBookingRoom(room)}
              canEdit={canEdit}
              onEdit={setEditing}
            />
          ))}
        </div>
      )}

      {editing && editingRoom ? (
        <BookRoomDialog room={editingRoom} booking={editing} onClose={() => setEditing(null)} />
      ) : null}
      {bookingRoom ? (
        <BookRoomDialog room={bookingRoom} defaultDate={formatApiDate(selected)} onClose={() => setBookingRoom(null)} />
      ) : null}
    </div>
  );
}
