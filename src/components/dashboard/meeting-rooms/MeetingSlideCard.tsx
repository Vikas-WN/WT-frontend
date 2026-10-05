"use client";

import { MapPin, StickyNote, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MeetingRoomBooking } from "@/types/meetingRoom";
import { formatClock, initials, type DayBooking } from "@/utils/meetingRoomSchedule";

/** One meeting as a gallery slide: when, what, where, who — highlighted while it's happening. */
export function MeetingSlideCard({
  item,
  now,
  mine,
  onEdit,
}: {
  item: DayBooking;
  now: Date;
  mine: boolean;
  /** Present when the viewer may edit this booking and it hasn't finished. */
  onEdit?: (booking: MeetingRoomBooking) => void;
}) {
  const { booking, start, end } = item;
  const live = start.getTime() <= now.getTime() && now.getTime() < end.getTime();
  const finished = end.getTime() <= now.getTime();

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-wt-surface-1 p-4 shadow-[var(--wt-shadow-sm)] sm:p-5",
        live ? "border-[var(--wt-brand)] ring-2 ring-[color-mix(in_srgb,var(--wt-brand)_20%,transparent)]" : "border-wt-border",
        finished && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="tabular-nums">
          <p className="text-lg font-bold leading-tight text-wt-text">{formatClock(start)}</p>
          <p className="text-xs text-wt-text-muted">to {formatClock(end)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {live ? <Badge>Happening now</Badge> : null}
          {mine ? <Badge variant="outline">Your booking</Badge> : null}
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 text-[0.9375rem] font-semibold leading-snug text-wt-text">{booking.title}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-wt-text-muted">
        <MapPin className="size-3.5 shrink-0" aria-hidden /> {booking.room_name}
      </p>

      {booking.attendees ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-wt-text-muted">
          <Users className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="line-clamp-2 break-words">{booking.attendees}</span>
        </p>
      ) : null}
      {booking.notes ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-wt-text-muted">
          <StickyNote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="line-clamp-2 break-words">{booking.notes}</span>
        </p>
      ) : null}

      <footer className="mt-auto flex items-center justify-between gap-2 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-wt-surface-2 text-[11px] font-semibold text-wt-text-muted">
            {initials(booking.booked_by.name)}
          </span>
          <div className="min-w-0 text-xs">
            <p className="truncate font-medium text-wt-text">{booking.booked_by.name}</p>
            {booking.booked_by.emp_id ? <p className="truncate text-wt-text-muted">{booking.booked_by.emp_id}</p> : null}
          </div>
        </div>
        {onEdit ? (
          <Button type="button" variant="outline" size="xs" onClick={() => onEdit(booking)}>
            Edit
          </Button>
        ) : null}
      </footer>
    </article>
  );
}
