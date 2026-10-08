/** Pure helpers for the Who's Out calendar (kept free of app imports so they can be unit-tested directly). */

export interface CalendarOccurrence {
  person: { name: string; email: string };
  entry: { type: string; is_half_day: boolean };
}

export function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Every day from `fromIso` to `toIso`, as ISO dates. */
export function eachIsoDay(fromIso: string, toIso: string): string[] {
  const out: string[] = [];
  const d = new Date(`${fromIso}T00:00:00`);
  const end = new Date(`${toIso}T00:00:00`);
  while (d <= end) {
    out.push(isoOf(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** The month as full weeks, Monday first: `null` pads the days of the neighbouring months. */
export function buildMonthCells(fromIso: string, toIso: string): (string | null)[] {
  const first = new Date(`${fromIso}T00:00:00`);
  const leading = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = [...Array.from({ length: leading }, () => null), ...eachIsoDay(fromIso, toIso)];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function isWeekend(iso: string): boolean {
  const day = new Date(`${iso}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

/** Group a day's people by kind of time off, in the given kind order, people A→Z within each. */
export function groupByKind<T extends CalendarOccurrence>(
  occurrences: readonly T[],
  orderOf: (type: string) => number
): Array<{ type: string; items: T[] }> {
  const groups = new Map<string, T[]>();
  for (const occ of occurrences) {
    const list = groups.get(occ.entry.type) ?? [];
    list.push(occ);
    groups.set(occ.entry.type, list);
  }
  return [...groups.entries()]
    .sort((a, b) => orderOf(a[0]) - orderOf(b[0]))
    .map(([type, items]) => ({ type, items: [...items].sort((x, y) => x.person.name.localeCompare(y.person.name)) }));
}

/** The day to show details for: the picked one if it is in the month, else today, else the first busy day. */
export function pickDefaultDay(
  picked: string | null,
  fromIso: string,
  toIso: string,
  todayIso: string,
  busyDays: readonly string[]
): string | null {
  const inMonth = (d: string) => d >= fromIso && d <= toIso;
  if (picked && inMonth(picked)) return picked;
  if (inMonth(todayIso)) return todayIso;
  return busyDays[0] ?? null;
}
