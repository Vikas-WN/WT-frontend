"use client";

import { useMemo, useState } from "react";

import { MEETING_ROOM_MAX_REPEAT_BOOKINGS, MEETING_ROOM_REPEAT_COPY } from "@/constants/meetingRooms";
import type { MeetingRoomRecurrence, MeetingRoomRepeatFrequency } from "@/types/meetingRoom";
import { formatApiDate, fromApiDate, parseApiDate } from "@/utils/apiDate";
import { mondayFirstWeekday, previewRepeatDates, type RepeatPreview } from "@/utils/meetingRoomRecurrence";

export type RepeatChoice = "NONE" | MeetingRoomRepeatFrequency;
export type RepeatEnds = "count" | "date";

const PREVIEW_ERROR: Record<Extract<RepeatPreview, { ok: false }>["reason"], string> = {
  "no-weekday": MEETING_ROOM_REPEAT_COPY.chooseWeekday,
  "no-end": "Choose when the repeat ends.",
  "before-start": "The last day is before the first booking.",
  "no-match": MEETING_ROOM_REPEAT_COPY.noDays,
  "too-many": `A repeat can book at most ${MEETING_ROOM_MAX_REPEAT_BOOKINGS} days.`,
};

/**
 * State for the "Repeat" section of the booking form: what the user picked, a live preview of the
 * days it books (the same rule the server applies), and the payload to send.
 * Local UI state only — nothing here is server data, so useState is the right tool.
 */
export function useRepeatForm(firstDate: string) {
  const [choice, setChoice] = useState<RepeatChoice>("NONE");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [ends, setEnds] = useState<RepeatEnds>("count");
  const [count, setCount] = useState("5");
  const [until, setUntil] = useState("");

  const repeating = choice !== "NONE";
  const first = useMemo(() => (firstDate ? fromApiDate(firstDate) : null), [firstDate]);

  const rule = useMemo(() => {
    if (!repeating) return null;
    const parsedCount = Number(count);
    const countOk = Number.isInteger(parsedCount) && parsedCount >= 2;
    const untilDate = until ? parseApiDate(until) : null;
    return {
      frequency: choice as MeetingRoomRepeatFrequency,
      weekdays,
      until: ends === "date" ? untilDate : null,
      count: ends === "count" && countOk ? parsedCount : null,
    };
  }, [repeating, choice, weekdays, ends, count, until]);

  const preview = useMemo(() => (first && rule ? previewRepeatDates(first, rule) : null), [first, rule]);
  const countOutOfRange = repeating && ends === "count" && rule?.count == null;
  const error = countOutOfRange
    ? `Enter a number of bookings between 2 and ${MEETING_ROOM_MAX_REPEAT_BOOKINGS}.`
    : preview && !preview.ok
      ? PREVIEW_ERROR[preview.reason]
      : null;

  const recurrence = useMemo((): MeetingRoomRecurrence | undefined => {
    if (!rule || !preview?.ok) return undefined;
    return {
      frequency: rule.frequency,
      ...(rule.frequency === "WEEKLY" ? { weekdays: [...weekdays].sort((a, b) => a - b) } : {}),
      ...(rule.until ? { until: formatApiDate(rule.until) } : { count: rule.count ?? undefined }),
    };
  }, [rule, preview, weekdays]);

  /** Switching to weekly pre-selects the first booking's weekday so there is something sensible to start from. */
  const changeChoice = (next: RepeatChoice) => {
    setChoice(next);
    if (next === "WEEKLY" && weekdays.length === 0 && first) setWeekdays([mondayFirstWeekday(first)]);
  };

  const toggleWeekday = (day: number) =>
    setWeekdays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]));

  return {
    choice,
    changeChoice,
    weekdays,
    toggleWeekday,
    ends,
    setEnds,
    count,
    setCount,
    until,
    setUntil,
    repeating,
    preview,
    error,
    recurrence,
    /** True when not repeating, or when the repeat is complete and bookable. */
    valid: !repeating || preview?.ok === true,
  };
}

export type RepeatForm = ReturnType<typeof useRepeatForm>;
