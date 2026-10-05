"use client";

import { CalendarHeart } from "lucide-react";

import { HomeCard } from "@/components/dashboard/home/HomeCard";
import { RsvpButtons } from "@/components/dashboard/events/RsvpButtons";
import { EVENT_COPY, EVENT_HOME_LIMIT } from "@/constants/events";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { useEvents, useRsvp } from "@/hooks/events/useEvents";
import { eventDateParts, formatEventRange } from "@/utils/eventTime";

/** Home widget: the next few events, answerable in one tap. */
export function UpcomingEventsHomeCard() {
  const events = useEvents();
  const rsvp = useRsvp();
  const next = (events.data ?? []).filter((event) => !event.is_cancelled).slice(0, EVENT_HOME_LIMIT);
  const awaiting = next.filter((event) => event.invited && event.my_response === null && event.rsvp_open).length;

  return (
    <HomeCard
      title={EVENT_COPY.homeTitle}
      icon={<CalendarHeart className="size-4" />}
      href={DASHBOARD_ROUTES.events}
      cta={awaiting > 0 ? `${awaiting} to answer` : EVENT_COPY.homeCta}
      featured={awaiting > 0}
    >
      {events.isLoading ? (
        <div className="space-y-2" aria-hidden>
          <div className="h-4 w-3/4 animate-pulse rounded bg-wt-surface-3" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-wt-surface-3" />
        </div>
      ) : next.length === 0 ? (
        <p className="text-sm text-wt-text-muted">{EVENT_COPY.homeEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {next.map((event) => {
            const date = eventDateParts(event.start_time);
            return (
              <li key={event.id} className="space-y-2">
                <a href={`${DASHBOARD_ROUTES.events}?eventId=${event.id}`} className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg bg-wt-brand-soft leading-none text-[var(--wt-brand)]" aria-hidden>
                    <span className="text-[8px] font-semibold tracking-wider">{date.month}</span>
                    <span className="text-sm font-bold tabular-nums">{date.day}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-wt-text">{event.title}</span>
                    <span className="block truncate text-xs text-wt-text-muted">{formatEventRange(event.start_time, event.end_time)}</span>
                  </span>
                </a>
                {event.invited && event.rsvp_open ? (
                  <RsvpButtons compact value={event.my_response} busy={rsvp.isPending} onChange={(response) => rsvp.mutate({ id: event.id, response })} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </HomeCard>
  );
}
