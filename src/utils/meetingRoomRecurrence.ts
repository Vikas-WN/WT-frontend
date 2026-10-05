import { MEETING_ROOM_MAX_REPEAT_BOOKINGS } from "@/constants/meetingRooms";
import type { MeetingRoomRepeatFrequency } from "@/types/meetingRoom";

export interface RepeatRuleInput {
  frequency: MeetingRoomRepeatFrequency;
  /** 0 = Monday … 6 = Sunday (WEEKLY only). */
  weekdays: number[];
  /** Exactly one of `until` / `count` is used. */
  until: Date | null;
  count: number | null;
}

export type RepeatPreview =
  | { ok: true; dates: Date[] }
  | { ok: false; reason: "no-weekday" | "no-end" | "before-start" | "no-match" | "too-many" };

/** Safety bound so a bad rule can't loop for years; mirrors the backend's span limit. */
const MAX_SPAN_DAYS = 366;

/** Monday = 0 … Sunday = 6 (JS getDay() is Sunday = 0). */
export function mondayFirstWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function matches(day: Date, frequency: MeetingRoomRepeatFrequency, weekdays: Set<number>): boolean {
  const weekday = mondayFirstWeekday(day);
  if (frequency === "DAILY") return true;
  if (frequency === "WEEKDAYS") return weekday < 5;
  return weekdays.has(weekday);
}

/**
 * The days a repeat rule books, starting from `first` — the same rule the server applies, so the
 * form's "N bookings" summary matches what gets created. Only days that match the rule count, so a
 * weekly Tue/Thu series started on a Monday begins on Tuesday.
 */
export function previewRepeatDates(first: Date, rule: RepeatRuleInput): RepeatPreview {
  const days = new Set(rule.weekdays);
  if (rule.frequency === "WEEKLY" && days.size === 0) return { ok: false, reason: "no-weekday" };
  if ((rule.until == null) === (rule.count == null)) return { ok: false, reason: "no-end" };

  const start = new Date(first.getFullYear(), first.getMonth(), first.getDate());
  if (rule.until && rule.until.getTime() < start.getTime()) return { ok: false, reason: "before-start" };

  const dates: Date[] = [];
  for (let offset = 0; offset <= MAX_SPAN_DAYS; offset += 1) {
    // Built from calendar parts, not by adding milliseconds, so a daylight-saving shift can't slide the date.
    const local = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
    if (rule.until && local.getTime() > rule.until.getTime()) break;
    if (!matches(local, rule.frequency, days)) continue;
    dates.push(local);
    if (dates.length > MEETING_ROOM_MAX_REPEAT_BOOKINGS) return { ok: false, reason: "too-many" };
    if (rule.count != null && dates.length >= rule.count) break;
  }
  return dates.length === 0 ? { ok: false, reason: "no-match" } : { ok: true, dates };
}
