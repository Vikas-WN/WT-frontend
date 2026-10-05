/** Pulse reviews are month-wise: a month is the `YYYY-MM` key the API uses
 *  for submissions and Submission Portal windows. */

const MONTH_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthKey(): string {
  return monthKeyOf(new Date());
}

export function isMonthKey(value: string | null | undefined): value is string {
  return MONTH_KEY.test(String(value ?? ""));
}

/** First day of the month, local time. */
export function monthStart(key: string): Date {
  const match = MONTH_KEY.exec(key);
  if (!match) return new Date(NaN);
  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

export function shiftMonth(key: string, delta: number): string {
  const start = monthStart(key);
  return monthKeyOf(new Date(start.getFullYear(), start.getMonth() + delta, 1));
}

export function formatMonthLabel(key: string, style: "long" | "short" = "long"): string {
  const start = monthStart(key);
  if (Number.isNaN(start.getTime())) return key;
  return start.toLocaleDateString("en-IN", {
    month: style === "long" ? "long" : "short",
    year: "numeric",
  });
}

/** Newest first, starting from `from` (default: this month). */
export function recentMonths(count: number, from: string = currentMonthKey()): string[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(from, -i));
}

/** -1 / 0 / 1 — month keys sort lexically. */
export function compareMonths(a: string, b: string): number {
  return a === b ? 0 : a < b ? -1 : 1;
}
