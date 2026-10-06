"use client";

import Link from "next/link";
import { CalendarHeart, ClipboardList, Megaphone } from "lucide-react";

import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { Badge } from "@/components/ui/badge";
import { ANNOUNCEMENT_CATEGORY_OPTIONS, categoryLabel } from "@/constants/contentCategories";
import { EVENT_TYPE_OPTIONS } from "@/constants/events";
import { HOME_UPDATES_COPY as COPY } from "@/constants/homeUpdates";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import type { HomeUpdate } from "@/hooks/dashboard/useHomeUpdates";
import { cn } from "@/lib/utils";
import { eventDateParts, formatEventRange } from "@/utils/eventTime";

const SLIDE_CLASS =
  "wt-lift group flex h-full w-full flex-col gap-1.5 rounded-2xl border border-wt-border bg-wt-surface-1 p-3.5 shadow-[var(--wt-shadow-sm)]";

function Kind({ icon, label, tone }: { icon: React.ReactNode; label: string; tone?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-wt-text-muted", tone)}>
      {icon}
      {label}
    </span>
  );
}

/** One card in the Home strip. The whole card is a link to the item. */
export function HomeUpdateSlide({ update }: { update: HomeUpdate }) {
  if (update.kind === "form") {
    const { form } = update;
    return (
      <Link href={`${DASHBOARD_ROUTES.forms}?formId=${form.id}`} className={SLIDE_CLASS}>
        <Kind icon={<ClipboardList className="size-3.5" />} label={COPY.form} />
        <p className="line-clamp-2 text-sm font-semibold text-wt-text">{form.title}</p>
        <p className={cn("mt-auto text-xs", form.overdue ? "font-medium text-rose-600 dark:text-rose-400" : "text-wt-text-muted")}>
          {form.overdue ? COPY.overdue : form.due_date ? `${COPY.due} ${form.due_date}` : `From ${form.created_by.name}`} ·{" "}
          <span className="font-medium text-[var(--wt-brand)]">{COPY.fillIn}</span>
        </p>
      </Link>
    );
  }
  if (update.kind === "event") {
    const { event } = update;
    const date = eventDateParts(event.start_time);
    const tone = EVENT_TYPE_OPTIONS.find((option) => option.value === event.event_type)?.tone ?? "neutral";
    return (
      <Link href={`${DASHBOARD_ROUTES.events}?eventId=${event.id}`} className={cn(SLIDE_CLASS, "flex-row gap-3")}>
        <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
          <span className="text-lg font-bold leading-none">{date.day}</span>
          <span className="text-[10px] font-semibold">{date.month}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Kind icon={<CalendarHeart className="size-3.5" />} label={COPY.event} />
          <p className="line-clamp-1 text-sm font-semibold text-wt-text">{event.title}</p>
          <p className="truncate text-xs text-wt-text-muted">{formatEventRange(event.start_time, event.end_time)}</p>
          <p className="mt-auto text-xs">
            {event.my_response === "GOING" ? (
              <Badge variant="secondary" className={filledBadgeClass("success")}>{COPY.going}</Badge>
            ) : event.invited && event.my_response === null && event.rsvp_open ? (
              <span className="font-medium text-[var(--wt-brand)]">{COPY.answerRsvp}</span>
            ) : (
              <Badge variant="secondary" className={filledBadgeClass(tone)}>
                {EVENT_TYPE_OPTIONS.find((option) => option.value === event.event_type)?.label}
              </Badge>
            )}
          </p>
        </div>
      </Link>
    );
  }
  const { announcement } = update;
  return (
    <Link href={`${DASHBOARD_ROUTES.announcements}?announcementId=${announcement.id}`} className={SLIDE_CLASS}>
      <div className="flex items-center justify-between gap-2">
        <Kind icon={<Megaphone className="size-3.5" />} label={COPY.announcement} />
        {!announcement.is_read ? (
          <span className="rounded-full bg-[var(--wt-brand)] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[var(--wt-brand-text)]">{COPY.newBadge}</span>
        ) : (
          <span className="text-[11px] text-wt-text-faint">{categoryLabel(ANNOUNCEMENT_CATEGORY_OPTIONS, announcement.category)}</span>
        )}
      </div>
      <p className="line-clamp-1 text-sm font-semibold text-wt-text">{announcement.title}</p>
      <p className="line-clamp-2 text-xs text-wt-text-muted">{announcement.body}</p>
    </Link>
  );
}
