"use client";

import { Megaphone, Pin } from "lucide-react";

import { HomeCard } from "@/components/dashboard/home/HomeCard";
import { ANNOUNCEMENT_COPY, ANNOUNCEMENT_HOME_LIMIT } from "@/constants/announcements";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { useAnnouncementsFeed } from "@/hooks/announcements/useAnnouncements";
import { cn } from "@/lib/utils";

/** Home widget: the latest announcements for me, unread ones highlighted. */
export function AnnouncementsHomeCard() {
  const feed = useAnnouncementsFeed();
  const items = (feed.data ?? []).slice(0, ANNOUNCEMENT_HOME_LIMIT);
  const unread = (feed.data ?? []).filter((item) => !item.is_read).length;

  return (
    <HomeCard
      title={ANNOUNCEMENT_COPY.homeTitle}
      icon={<Megaphone className="size-4" />}
      href={DASHBOARD_ROUTES.announcements}
      cta={unread > 0 ? `${unread} new` : ANNOUNCEMENT_COPY.homeCta}
      featured={unread > 0}
    >
      {feed.isLoading ? (
        <div className="space-y-2" aria-hidden>
          <div className="h-4 w-3/4 animate-pulse rounded bg-wt-surface-3" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-wt-surface-3" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-wt-text-muted">{ANNOUNCEMENT_COPY.homeEmpty}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`${DASHBOARD_ROUTES.announcements}?announcementId=${item.id}`}
                className="group block rounded-lg px-1 py-0.5 transition-colors hover:bg-wt-surface-2"
              >
                <span className="flex items-center gap-1.5">
                  {!item.is_read ? <span className="size-2 shrink-0 rounded-full bg-[var(--wt-brand)]" aria-label="Unread" /> : null}
                  {item.is_pinned ? <Pin className="size-3 shrink-0 text-[var(--wt-brand)]" aria-hidden /> : null}
                  <span className={cn("truncate text-sm text-wt-text", !item.is_read && "font-semibold")}>{item.title}</span>
                </span>
                <span className="block truncate text-xs text-wt-text-muted">{item.created_by.name}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </HomeCard>
  );
}
