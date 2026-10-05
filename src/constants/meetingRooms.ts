/**
 * A room's schedule changes the moment anyone books, edits or cancels, and the people looking at
 * it aren't told. So an open schedule re-reads itself every few seconds and whenever the window
 * regains focus — an edited time is on everyone's screen within roughly this long.
 */
export const MEETING_ROOM_REFRESH_MS = 8_000;
export const MEETING_ROOM_STALE_MS = 4_000;

/** Repeat-booking form copy and limits. The backend enforces the same maximum. */
export const MEETING_ROOM_MAX_REPEAT_BOOKINGS = 60;

export const MEETING_ROOM_REPEAT_OPTIONS = [
  { value: "NONE", label: "Does not repeat" },
  { value: "DAILY", label: "Every day" },
  { value: "WEEKDAYS", label: "Every weekday (Mon–Fri)" },
  { value: "WEEKLY", label: "Weekly on chosen days" },
] as const;

/** Monday-first, matching the backend's 0 = Monday … 6 = Sunday. */
export const MEETING_ROOM_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const MEETING_ROOM_REPEAT_COPY = {
  repeatLabel: "Repeat",
  weekdaysLabel: "Repeat on",
  endsLabel: "Ends",
  endsOnDate: "On a date",
  endsAfterCount: "After a number of bookings",
  untilLabel: "Last day",
  countLabel: "Number of bookings",
  noDays: "No days match that pattern before the end date.",
  chooseWeekday: "Choose at least one weekday.",
  clashNote: "Days someone else has already booked are skipped, and you'll see which ones.",
  cancelTitle: "Cancel a repeating booking",
  cancelThis: "Just this day",
  cancelUpcoming: "This and all later days",
  cancelUpcomingHint: "Earlier days stay as they are.",
  keepIt: "Keep it",
  repeatBadge: "Repeats",
} as const;

/** How many skipped dates the booking toast names before saying "and N more". */
export const MEETING_ROOM_SKIPPED_PREVIEW_LIMIT = 5;
