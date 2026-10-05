"use client";

import { Download } from "lucide-react";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { PagedList } from "@/components/dashboard/ui/PagedList";
import { Button } from "@/components/ui/button";
import { POLL_COPY } from "@/constants/announcements";
import { usePollResults } from "@/hooks/announcements/useAnnouncements";
import type { PollPerson } from "@/types/announcement";
import { formatApiDateTimeDisplay } from "@/utils/apiDate";
import { exportPollPdf } from "@/utils/pollPdf";

function People({ people, empty, idPrefix }: { people: PollPerson[]; empty: string; idPrefix: string }) {
  return (
    <PagedList
      items={people}
      idPrefix={idPrefix}
      empty={<p className="px-3 py-2 text-sm text-wt-text-muted">{empty}</p>}
      matches={(person, needle) => person.name.toLowerCase().includes(needle) || person.email.toLowerCase().includes(needle)}
      wrap={(rows) => <ul className="divide-y divide-wt-border">{rows}</ul>}
      renderItem={(person) => (
        <li key={person.email} className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-wt-text">{person.name}</span>
            <span className="block truncate text-xs text-wt-text-muted">{person.email}</span>
          </span>
          {person.voted_at ? (
            <span className="shrink-0 text-xs text-wt-text-faint">{formatApiDateTimeDisplay(person.voted_at)}</span>
          ) : null}
        </li>
      )}
    />
  );
}

/** HR/Admin (or the poster): who picked each option, who hasn't voted, and a PDF of it all. */
export function PollResultsDialog({ announcementId, onClose }: { announcementId: number; onClose: () => void }) {
  const query = usePollResults(announcementId);
  const data = query.data;

  return (
    <WtFormDialog
      open
      title={data?.title ?? POLL_COPY.resultsTitle}
      description={data ? `${data.question} · ${data.total_voters} of ${data.recipient_count} voted` : undefined}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
    >
      {query.isLoading ? (
        <p className="text-sm text-wt-text-muted">Loading…</p>
      ) : !data ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{POLL_COPY.loadError}</p>
      ) : (
        <div className="space-y-5">
          <div className="flex justify-end">
            <Button type="button" size="sm" variant="outline" onClick={() => exportPollPdf(data)}>
              <Download className="size-3.5" /> {POLL_COPY.exportPdf}
            </Button>
          </div>
          {data.options.map((option) => (
            <section key={option.id} className="overflow-hidden rounded-xl border border-wt-border">
              <h4 className="flex items-center justify-between bg-wt-surface-2 px-3 py-2 text-sm font-semibold text-wt-text">
                {option.label}
                <span className="tabular-nums text-xs font-medium text-wt-text-muted">{option.votes}</span>
              </h4>
              <People people={option.voters} empty={POLL_COPY.noVoters} idPrefix={`poll-option-${option.id}`} />
            </section>
          ))}
          <section className="overflow-hidden rounded-xl border border-wt-border">
            <h4 className="bg-wt-surface-2 px-3 py-2 text-sm font-semibold text-wt-text">
              {POLL_COPY.notVoted(data.not_voted.length)}
            </h4>
            <People people={data.not_voted} empty={POLL_COPY.everyoneVoted} idPrefix="poll-not-voted" />
          </section>
        </div>
      )}
    </WtFormDialog>
  );
}
