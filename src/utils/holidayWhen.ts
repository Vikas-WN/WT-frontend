/** "Tomorrow · Tuesday", "Sunday · in 13 days": how far away a holiday is, for the Home card. No app imports. */

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function daysUntil(date: Date, today: Date): number {
  return Math.round((startOfDay(date) - startOfDay(today)) / 86_400_000);
}

export function holidayWhen(date: Date, today: Date): string {
  const days = daysUntil(date, today);
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  if (days === 0) return `Today · ${weekday}`;
  if (days === 1) return `Tomorrow · ${weekday}`;
  return `${weekday} · in ${days} days`;
}
