"use client";

import { MapPin, Users } from "lucide-react";

import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { AddToCalendarMenu } from "@/components/dashboard/calendar/AddToCalendarMenu";
import { RsvpButtons } from "@/components/dashboard/events/RsvpButtons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EVENT_COPY, EVENT_TYPE_OPTIONS } from "@/constants/events";
import { cn } from "@/lib/utils";
import type { AppEvent, RsvpChoice } from "@/types/event";
import { eventDateParts, formatEventRange } from "@/utils/eventTime";

function closedLabel(event: AppEvent): string | null {
  if (event.is_cancelled) return EVENT_COPY.cancelled;
  if (!event.rsvp_open) return EVENT_COPY.rsvpClosed;
  return null;
}

/** One event: date block, details, who's coming and — if I'm invited — my RSVP. */
export function EventCard({
  event,
  busy,
  highlighted,
  onRsvp,
  onManage,
}: {
  event: AppEvent;
  busy?: boolean;
  highlighted?: boolean;
  onRsvp: (id: number, response: RsvpChoice) => void;
  /** HR/Admin/organiser: open the attendee list. */
  onManage?: (event: AppEvent) => void;
}) {
  const type = EVENT_TYPE_OPTIONS.find((option) => option.value === event.event_type) ?? EVENT_TYPE_OPTIONS[EVENT_TYPE_OPTIONS.length - 1];
  const date = eventDateParts(event.start_time);
  const closed = closedLabel(event);
  const full = event.spots_left === 0 && event.my_response !== "GOING";
  const fill = event.capacity ? Math.min(100, Math.round((event.counts.going / event.capacity) * 100)) : null;

  return (
    <article
      id={`event-${event.id}`}
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-wt-surface-1 p-4 shadow-[var(--wt-shadow-sm)] transition-shadow hover:shadow-[var(--wt-shadow-md)] sm:p-5",
        event.is_cancelled && "opacity-70",
        highlighted ? "border-[var(--wt-brand)] ring-2 ring-[color-mix(in_srgb,var(--wt-brand)_25%,transparent)]" : "border-wt-border"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-wt-brand-soft text-[var(--wt-brand)]" aria-hidden>
          <span className="text-[10px] font-semibold uppercase tracking-wider">{date.month}</span>
          <span className="text-xl font-bold leading-none tabular-nums">{date.day}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className={filledBadgeClass(type.tone)}>
              {type.emoji} {type.label}
            </Badge>
            {closed ? <Badge variant="secondary" className={filledBadgeClass(event.is_cancelled ? "danger" : "neutral")}>{closed}</Badge> : null}
            {full ? <Badge variant="secondary" className={filledBadgeClass("warning")}>{EVENT_COPY.full}</Badge> : null}
          </div>
          <h3 className="mt-1.5 text-[0.9375rem] font-semibold leading-snug text-wt-text">{event.title}</h3>
          <p className="mt-0.5 text-xs text-wt-text-muted">{formatEventRange(event.start_time, event.end_time)}</p>
        </div>
      </div>

      {event.location ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-wt-text-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden /> <span className="truncate">{event.location}</span>
        </p>
      ) : null}
      {event.description ? <p className="mt-2 line-clamp-2 text-sm text-wt-text-muted">{event.description}</p> : null}

      <div className="mt-auto space-y-3 pt-4">
        <div>
          <div className="flex items-center justify-between text-xs text-wt-text-muted">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden />
              <span className="font-semibold text-wt-text">{event.counts.going}</span> going
              {event.counts.maybe > 0 ? ` · ${event.counts.maybe} maybe` : ""}
            </span>
            {event.spots_left != null ? <span>{event.spots_left} {EVENT_COPY.spotsLeft}</span> : null}
          </div>
          {fill != null ? (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-wt-surface-3" aria-hidden>
              <div className="h-full rounded-full bg-[var(--wt-brand)] transition-all" style={{ width: `${fill}%` }} />
            </div>
          ) : null}
        </div>

        {event.invited ? (
          <RsvpButtons
            value={event.my_response}
            disabled={!event.rsvp_open || full}
            busy={busy}
            onChange={(response) => onRsvp(event.id, response)}
          />
        ) : (
          <p className="text-xs text-wt-text-faint">{EVENT_COPY.organisedBy} you</p>
        )}

        {!event.is_cancelled ? <AddToCalendarMenu event={event} /> : null}

        {onManage && event.can_manage ? (
          <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => onManage(event)}>
            {EVENT_COPY.whoIsComing}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
