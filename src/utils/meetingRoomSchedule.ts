import type { MeetingRoomBooking } from "@/types/meetingRoom";

export const DAY_MS = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;
export const DEFAULT_START_HOUR = 8;
export const DEFAULT_END_HOUR = 20;
const SLOT_STEP_MIN = 15;

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** API date-times are `dd/mm/yyyy HH:MM[:SS]` in the app timezone. */
export function parseBookingTime(value: string): Date {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value.trim());
  if (!m) return new Date(NaN);
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0));
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
}

export function formatHour(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 || hour === 24 ? "a" : "p"}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export type DayBooking = {
  booking: MeetingRoomBooking;
  start: Date;
  end: Date;
};

/** Bookings that overlap `day`, with times parsed once, earliest first. */
export function bookingsOnDay(bookings: MeetingRoomBooking[], day: Date): DayBooking[] {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + DAY_MS;
  return bookings
    .map((booking) => ({ booking, start: parseBookingTime(booking.start_time), end: parseBookingTime(booking.end_time) }))
    .filter(({ start, end }) => !Number.isNaN(start.getTime()) && start.getTime() < dayEnd && end.getTime() > dayStart)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export type RoomStatusKind = "free" | "in-use" | "busy-day" | "past";

export interface RoomStatus {
  kind: RoomStatusKind;
  /** Short chip text: "Free now", "In use until 3:30 PM", "Free all day", "3 bookings". */
  label: string;
  /** One line of context: what's happening, or when the room is next taken. */
  detail: string | null;
}

/**
 * Where a room stands. For today it's live ("Free now", "In use until …"); for another day it's a summary.
 * `now` is passed in so the result stays a pure function of its inputs.
 */
export function roomStatus(items: DayBooking[], day: Date, now: Date): RoomStatus {
  const today = sameDay(day, now);
  if (!today) {
    if (day.getTime() < startOfDay(now).getTime()) {
      return { kind: "past", label: items.length === 0 ? "Wasn't booked" : `${items.length} booking${items.length === 1 ? "" : "s"}`, detail: null };
    }
    return items.length === 0
      ? { kind: "free", label: "Free all day", detail: null }
      : { kind: "busy-day", label: `${items.length} booking${items.length === 1 ? "" : "s"}`, detail: null };
  }
  const nowMs = now.getTime();
  const current = items.find((i) => i.start.getTime() <= nowMs && nowMs < i.end.getTime());
  if (current) {
    return { kind: "in-use", label: `In use until ${formatClock(current.end)}`, detail: current.booking.title };
  }
  const next = items.find((i) => i.start.getTime() > nowMs);
  if (next) return { kind: "free", label: "Free now", detail: `Next: ${formatClock(next.start)} · ${next.booking.title}` };
  return { kind: "free", label: "Free now", detail: items.length === 0 ? "Nothing booked today" : "No more bookings today" };
}

/**
 * The earliest start (on the quarter hour, within working hours) from which `minutes` are free in this room on `day`,
 * or null if there's no such gap. For today it never suggests a time that has passed.
 */
export function nextFreeSlot(items: DayBooking[], day: Date, now: Date, minutes = 30): Date | null {
  const dayStart = startOfDay(day).getTime();
  let cursor = dayStart + DEFAULT_START_HOUR * HOUR_MS;
  if (sameDay(day, now)) {
    const step = SLOT_STEP_MIN * 60_000;
    cursor = Math.max(cursor, Math.ceil(now.getTime() / step) * step);
  }
  const limit = dayStart + DEFAULT_END_HOUR * HOUR_MS;
  const need = minutes * 60_000;
  for (const item of items) {
    if (item.end.getTime() <= cursor) continue;
    if (item.start.getTime() >= cursor + need) break; // the gap before this booking is big enough
    cursor = Math.max(cursor, item.end.getTime());
  }
  return cursor + need <= limit ? new Date(cursor) : null;
}
