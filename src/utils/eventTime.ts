import { parseApiDate } from "@/utils/apiDate";

const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
const DAY_FORMAT = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
const MONTH_FORMAT = new Intl.DateTimeFormat("en-GB", { month: "short" });

/** "dd/mm/yyyy HH:MM[:SS]" (the API's date-time, office time) -> a local Date, or null. */
export function parseApiDateTime(value: string | null | undefined): Date | null {
  const [datePart, timePart = "00:00"] = String(value ?? "").trim().split(/\s+/);
  const date = parseApiDate(datePart);
  if (!date) return null;
  const [hours, minutes] = timePart.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function eventDateParts(start: string): { day: string; month: string } {
  const date = parseApiDateTime(start);
  return date ? { day: String(date.getDate()), month: MONTH_FORMAT.format(date).toUpperCase() } : { day: "–", month: "" };
}

/** "Wed 15 Oct · 10:00 – 11:30" (adds the end date when the event spans days). */
export function formatEventRange(start: string, end: string): string {
  const from = parseApiDateTime(start);
  const to = parseApiDateTime(end);
  if (!from || !to) return "";
  const sameDay = from.toDateString() === to.toDateString();
  return sameDay
    ? `${DAY_FORMAT.format(from)} · ${TIME_FORMAT.format(from)} – ${TIME_FORMAT.format(to)}`
    : `${DAY_FORMAT.format(from)} ${TIME_FORMAT.format(from)} → ${DAY_FORMAT.format(to)} ${TIME_FORMAT.format(to)}`;
}
