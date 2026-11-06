/** A timelog entry is logged as a start and end time ("HH:MM", 24-hour); its hours are worked out from them. */

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const TIMELOG_MIN_MINUTES = 30;

function toMinutes(time: string): number | null {
  const match = TIME_PATTERN.exec(time.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** Hours between two times on the same day (two decimals), or null when either is missing or the order is wrong. */
export function hoursBetween(start: string, end: string): number | null {
  const from = toMinutes(start);
  const to = toMinutes(end);
  if (from === null || to === null || to <= from) return null;
  return Math.round(((to - from) / 60) * 100) / 100;
}

/** "3h 30m" — the duration shown next to the time pickers and on each entry. */
export function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h && m) return `${h}h ${m}m`;
  return h ? `${h}h` : `${m}m`;
}

/** "09:30 – 13:00", or null for an entry logged only in hours. */
export function formatTimeRange(start?: string | null, end?: string | null): string | null {
  return start && end ? `${start.slice(0, 5)} – ${end.slice(0, 5)}` : null;
}

/** Why this start/end pair can't be saved — or null when it can. */
export function validateEntryTimes(start: string, end: string): string | null {
  if (!start || !end) return "Enter a start and an end time.";
  if (toMinutes(start) === null || toMinutes(end) === null) return "Enter the times as HH:MM.";
  const hours = hoursBetween(start, end);
  if (hours === null) return "The end time must be after the start time.";
  if (hours * 60 < TIMELOG_MIN_MINUTES) return "An entry must be at least 30 minutes.";
  return null;
}
