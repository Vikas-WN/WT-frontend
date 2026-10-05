import { DEFAULT_END_HOUR, DEFAULT_START_HOUR, HOUR_MS, formatClock, formatHour, startOfDay, type DayBooking } from "@/utils/meetingRoomSchedule";

/** The working-day window to draw: the default hours, widened if a booking falls outside them. */
export function dayWindow(items: DayBooking[], day: Date): { startHour: number; endHour: number } {
  const dayStart = startOfDay(day).getTime();
  return {
    startHour: Math.min(DEFAULT_START_HOUR, ...items.map((i) => Math.max(0, Math.floor((i.start.getTime() - dayStart) / HOUR_MS)))),
    endHour: Math.max(DEFAULT_END_HOUR, ...items.map((i) => Math.min(24, Math.ceil((i.end.getTime() - dayStart) / HOUR_MS)))),
  };
}

/** A horizontal bar of the day: booked stretches are filled, the rest is free; an optional marker shows "now". */
export function RoomAvailabilityBar({
  items,
  day,
  startHour,
  endHour,
  myEmail,
  nowMs,
}: {
  items: DayBooking[];
  day: Date;
  startHour: number;
  endHour: number;
  myEmail: string;
  /** Draw a "now" marker at this time (today only). */
  nowMs?: number;
}) {
  const dayStart = startOfDay(day).getTime();
  const winStart = dayStart + startHour * HOUR_MS;
  const winEnd = dayStart + endHour * HOUR_MS;
  const span = winEnd - winStart;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const nowPct = nowMs != null && nowMs >= winStart && nowMs <= winEnd ? ((nowMs - winStart) / span) * 100 : null;

  return (
    <div>
      <div className="relative h-7 overflow-hidden rounded-lg bg-wt-surface-2">
        {hours.slice(1, -1).map((h) => (
          <div key={h} className="absolute inset-y-0 w-px bg-wt-border/70" style={{ left: `${((h - startHour) / (endHour - startHour)) * 100}%` }} />
        ))}
        {items.map(({ booking, start, end }) => {
          const left = Math.max(0, (start.getTime() - winStart) / span) * 100;
          const right = Math.min(1, (end.getTime() - winStart) / span) * 100;
          const mine = myEmail !== "" && booking.booked_by.email.toLowerCase() === myEmail;
          return (
            <div
              key={booking.id}
              title={`${formatClock(start)} – ${formatClock(end)} · ${booking.title} · ${booking.booked_by.name}`}
              className="absolute inset-y-1 rounded-md"
              style={{
                left: `${left}%`,
                width: `${Math.max(right - left, 0.8)}%`,
                background: mine ? "var(--wt-brand)" : "color-mix(in srgb, var(--wt-brand) 45%, transparent)",
              }}
            />
          );
        })}
        {nowPct != null ? (
          <div className="absolute inset-y-0 z-10 w-0.5 bg-rose-500" style={{ left: `${nowPct}%` }} aria-label="Now" />
        ) : null}
      </div>
      <div className="relative mt-1 h-3.5 text-[10px] tabular-nums text-wt-text-faint">
        {hours.map((h, i) =>
          i % 2 === 0 ? (
            <span
              key={h}
              className="absolute -translate-x-1/2 first:translate-x-0 last:translate-x-[-100%]"
              style={{ left: `${((h - startHour) / (endHour - startHour)) * 100}%` }}
            >
              {formatHour(h)}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}
