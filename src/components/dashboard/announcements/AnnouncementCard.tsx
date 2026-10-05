"use client";

import { useState } from "react";
import { Pin } from "lucide-react";

import { AuthorAvatar } from "@/components/dashboard/announcements/AuthorAvatar";
import { ANNOUNCEMENT_COLLAPSE_CHARS, ANNOUNCEMENT_COPY } from "@/constants/announcements";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/types/announcement";
import { formatApiDateTimeDisplay } from "@/utils/apiDate";

/** One announcement in someone's feed. Opening a long one (or any unread one) marks it read. */
export function AnnouncementCard({
  announcement,
  highlighted,
  onOpen,
}: {
  announcement: Announcement;
  highlighted?: boolean;
  onOpen: (announcement: Announcement) => void;
}) {
  const long = announcement.body.length > ANNOUNCEMENT_COLLAPSE_CHARS;
  const [expanded, setExpanded] = useState(!long);

  const open = () => {
    if (!announcement.is_read) onOpen(announcement);
  };

  return (
    <article
      id={`announcement-${announcement.id}`}
      onClick={open}
      className={cn(
        "group relative rounded-2xl border bg-wt-surface-1 p-4 shadow-[var(--wt-shadow-sm)] transition-shadow hover:shadow-[var(--wt-shadow-md)] sm:p-5",
        announcement.is_pinned && "border-[color-mix(in_srgb,var(--wt-brand)_30%,transparent)]",
        highlighted ? "border-[var(--wt-brand)] ring-2 ring-[color-mix(in_srgb,var(--wt-brand)_25%,transparent)]" : "border-wt-border"
      )}
    >
      <div className="flex items-start gap-3">
        <AuthorAvatar name={announcement.created_by.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-[0.9375rem] font-semibold text-wt-text">{announcement.title}</h3>
            {!announcement.is_read ? (
              <span className="rounded-full bg-[var(--wt-brand)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                {ANNOUNCEMENT_COPY.unread}
              </span>
            ) : null}
            {announcement.is_pinned ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--wt-brand)]">
                <Pin className="size-3" aria-hidden /> {ANNOUNCEMENT_COPY.pinned}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-wt-text-muted">
            {announcement.created_by.name} · {formatApiDateTimeDisplay(announcement.created_at)}
          </p>
          <p
            className={cn(
              "mt-3 whitespace-pre-wrap text-sm leading-relaxed text-wt-text",
              !expanded && "line-clamp-3"
            )}
          >
            {announcement.body}
          </p>
          {long ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setExpanded((value) => !value);
                open();
              }}
              className="mt-2 text-xs font-medium text-[var(--wt-brand)] hover:underline"
            >
              {expanded ? ANNOUNCEMENT_COPY.readLess : ANNOUNCEMENT_COPY.readMore}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
