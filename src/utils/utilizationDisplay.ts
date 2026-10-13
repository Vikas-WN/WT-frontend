/** Small pure helpers for the utilisation heatmap (kept free of app imports so they can be unit-tested directly). */

export interface Thresholds {
  over_above: number;
  full_from: number;
  partial_from: number;
}

export type Level = "over" | "full" | "partial" | "bench" | "none";

/** The band a percentage falls in, using the same thresholds the server reports. */
export function levelFor(percent: number | null, t: Thresholds): Level {
  if (percent === null) return "none";
  if (percent > t.over_above) return "over";
  if (percent >= t.full_from) return "full";
  if (percent >= t.partial_from) return "partial";
  return "bench";
}

/** The Monday of the week containing `day`. */
export function mondayOf(day: Date): Date {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

/** The Monday `weeksBack` weeks before this week (or after, when negative). */
export function startOfViewWeek(today: Date, weeksBack: number, shiftWeeks = 0): Date {
  const d = mondayOf(today);
  d.setDate(d.getDate() - 7 * (weeksBack - shiftWeeks));
  return d;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** "12 Oct" */
export function shortDay(day: Date): string {
  return `${day.getDate()} ${MONTHS[day.getMonth()]}`;
}

/** A percentage for a cell: whole numbers, and a dash when there is none. */
export function percentLabel(percent: number | null): string {
  return percent === null ? "—" : `${Math.round(percent)}%`;
}

/** Headline counts for one week from a list of planned percentages. */
export function bandCounts(percents: readonly number[], t: Thresholds): Record<"over" | "full" | "partial" | "bench", number> {
  const out = { over: 0, full: 0, partial: 0, bench: 0 };
  for (const p of percents) {
    const band = levelFor(p, t);
    if (band !== "none") out[band] += 1;
  }
  return out;
}
