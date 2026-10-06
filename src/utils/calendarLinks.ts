import { OFFICE_TIME_ZONE } from "@/constants/calendar";
import type { AppEvent } from "@/types/event";

/** "dd/mm/yyyy HH:MM[:SS]" -> "YYYYMMDDTHHMMSS" (no zone: Google reads it with `ctz`). */
function toGoogleLocal(value: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return "";
  const [, dd, mm, yyyy, hh, min] = match;
  return `${yyyy}${mm}${dd}T${hh}${min}00`;
}

/** A "create event" link for Google Calendar pre-filled from a WebTrak event. */
export function googleCalendarEventUrl(event: AppEvent, eventPageUrl: string): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toGoogleLocal(event.start_time)}/${toGoogleLocal(event.end_time)}`,
    ctz: OFFICE_TIME_ZONE,
    details: [event.description?.trim(), eventPageUrl].filter(Boolean).join("\n\n"),
  });
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
