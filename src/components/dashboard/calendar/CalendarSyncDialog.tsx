"use client";

import { Apple, CalendarPlus, Copy, RefreshCw } from "lucide-react";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { Button } from "@/components/ui/button";
import { CALENDAR_COPY as COPY } from "@/constants/calendar";
import { useCalendarFeed, useRegenerateCalendarFeed } from "@/hooks/calendar/useCalendar";
import { notifySuccess } from "@/lib/notify";

/** Subscribe to your WebTrak calendar from Apple, Google or any calendar app. */
export function CalendarSyncDialog({ onClose }: { onClose: () => void }) {
  const feed = useCalendarFeed();
  const regenerate = useRegenerateCalendarFeed();
  const links = feed.data;

  const copy = async () => {
    if (!links) return;
    try {
      await navigator.clipboard.writeText(links.https_url);
      notifySuccess(COPY.copied);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the link is still selectable in the field.
    }
  };

  return (
    <WtFormDialog open title={COPY.dialogTitle} description={COPY.dialogDescription} onClose={onClose} maxWidthClass="max-w-xl">
      {feed.isLoading ? (
        <p className="text-sm text-wt-text-muted">Loading…</p>
      ) : !links ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{COPY.loadError}</p>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Button type="button" variant="brand" render={<a href={links.webcal_url} />}>
              <Apple className="size-4" /> {COPY.apple}
            </Button>
            <Button type="button" variant="outline" render={<a href={links.google_url} target="_blank" rel="noopener noreferrer" />}>
              <CalendarPlus className="size-4" /> {COPY.google}
            </Button>
          </div>
          <p className="text-xs text-wt-text-muted">{COPY.googleNote}</p>

          <div className="space-y-1.5">
            <label htmlFor="calendar-feed-link" className="text-xs font-medium text-wt-text-muted">
              {COPY.linkLabel}
            </label>
            <div className="flex gap-2">
              <input
                id="calendar-feed-link"
                readOnly
                value={links.https_url}
                onFocus={(event) => event.currentTarget.select()}
                className="h-10 min-w-0 flex-1 rounded-lg border border-wt-border bg-wt-surface-2 px-3 text-xs text-wt-text"
              />
              <Button type="button" variant="outline" onClick={copy}>
                <Copy className="size-4" /> {COPY.copy}
              </Button>
            </div>
          </div>

          <p className="rounded-lg bg-wt-surface-2 px-3 py-2 text-xs text-wt-text-muted">{COPY.included}</p>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-wt-border pt-4">
            <p className="max-w-sm text-xs text-wt-text-muted">
              {COPY.privateNote} {COPY.regenerateHint}
            </p>
            <Button type="button" size="sm" variant="outline" disabled={regenerate.isPending} onClick={() => regenerate.mutate()}>
              <RefreshCw className="size-3.5" /> {COPY.regenerate}
            </Button>
          </div>
        </div>
      )}
    </WtFormDialog>
  );
}
