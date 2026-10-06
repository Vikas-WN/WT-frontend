"use client";

import { CalendarPlus, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CALENDAR_COPY as COPY } from "@/constants/calendar";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { useDownloadEventIcs } from "@/hooks/calendar/useCalendar";
import type { AppEvent } from "@/types/event";
import { googleCalendarEventUrl } from "@/utils/calendarLinks";

/** "Add to calendar" for one event: Google Calendar in a new tab, or an .ics file for Apple / Outlook. */
export function AddToCalendarMenu({ event }: { event: AppEvent }) {
  const download = useDownloadEventIcs();
  const pageUrl = `${typeof window === "undefined" ? "" : window.location.origin}${DASHBOARD_ROUTES.events}?eventId=${event.id}`;

  return (
    <details className="group relative">
      <summary className="list-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-[var(--wt-brand)] hover:bg-wt-surface-2">
          <CalendarPlus className="size-3.5" aria-hidden /> {COPY.addToCalendar}
        </span>
      </summary>
      <div className="absolute bottom-full left-0 z-20 mb-1 w-56 rounded-xl border border-wt-border bg-wt-surface-1 p-1 shadow-[var(--wt-shadow-md)]">
        <Button type="button" variant="ghost" size="sm" className="w-full justify-start" render={<a href={googleCalendarEventUrl(event, pageUrl)} target="_blank" rel="noopener noreferrer" />}>
          <CalendarPlus className="size-3.5" /> {COPY.addGoogle}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="w-full justify-start" disabled={download.isPending} onClick={() => download.mutate(event.id)}>
          <Download className="size-3.5" /> {COPY.downloadIcs}
        </Button>
      </div>
    </details>
  );
}
