/** The default window for "Previous Requests": from the first day of last month to the last day of this month. No app imports. */

const pad = (n: number) => String(n).padStart(2, "0");
const apiDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

export function lastMonthToThisMonthRange(now: Date): { from: string; to: string } {
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: apiDate(from), to: apiDate(to) };
}
