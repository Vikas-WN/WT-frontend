"use client";

import { Archive, ArchiveRestore, Pin, PinOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ANNOUNCEMENT_COPY } from "@/constants/announcements";
import { describeAudience } from "@/constants/audience";
import { cn } from "@/lib/utils";
import type { Announcement, AnnouncementUpdatePayload } from "@/types/announcement";
import { formatApiDateTimeDisplay } from "@/utils/apiDate";

/** An announcement I posted: who it reached, how many have read it, and pin / archive controls. */
export function PostedAnnouncementCard({
  announcement,
  busy,
  onUpdate,
}: {
  announcement: Announcement;
  busy: boolean;
  onUpdate: (id: number, payload: AnnouncementUpdatePayload) => void;
}) {
  const total = announcement.recipient_count ?? 0;
  const read = announcement.read_count ?? 0;
  const percent = total > 0 ? Math.round((read / total) * 100) : 0;
  const audience = announcement.audience;

  return (
    <article
      className={cn(
        "rounded-2xl border border-wt-border bg-wt-surface-1 p-4 shadow-[var(--wt-shadow-sm)] sm:p-5",
        announcement.is_archived && "opacity-60"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[0.9375rem] font-semibold text-wt-text">{announcement.title}</h3>
          <p className="mt-0.5 text-xs text-wt-text-muted">
            {formatApiDateTimeDisplay(announcement.created_at)}
            {audience
              ? ` · ${describeAudience(audience.scope, {
                  departments: audience.departments.length,
                  projects: audience.project_ids.length,
                  users: audience.user_ids.length,
                })}`
              : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onUpdate(announcement.id, { is_pinned: !announcement.is_pinned })}
          >
            {announcement.is_pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            {announcement.is_pinned ? ANNOUNCEMENT_COPY.unpin : ANNOUNCEMENT_COPY.pin}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onUpdate(announcement.id, { is_archived: !announcement.is_archived })}
          >
            {announcement.is_archived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
            {announcement.is_archived ? ANNOUNCEMENT_COPY.unarchive : ANNOUNCEMENT_COPY.archive}
          </Button>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 whitespace-pre-wrap text-sm text-wt-text-muted">{announcement.body}</p>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-wt-text-muted">
          <span>
            Read by <span className="font-semibold text-wt-text">{read}</span> of {total}
          </span>
          <span className="tabular-nums">{percent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-wt-surface-3" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-[var(--wt-brand)] transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </article>
  );
}
