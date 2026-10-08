const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "10 Oct", "10 – 11 Oct", "30 Oct – 2 Nov" — the year is left off unless the range is not in `now`'s year. */
export function formatShortRange(start: Date, end: Date, now: Date = new Date()): string {
  const day = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const year = (d: Date) => (d.getFullYear() === now.getFullYear() ? "" : ` ${d.getFullYear()}`);
  if (sameDay(start, end)) return `${day(start)}${year(end)}`;
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) return `${start.getDate()} – ${day(end)}${year(end)}`;
  return `${day(start)}${year(start)} – ${day(end)}${year(end)}`;
}
