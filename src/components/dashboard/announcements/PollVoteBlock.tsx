"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { POLL_COPY } from "@/constants/announcements";
import { useVotePoll } from "@/hooks/announcements/useAnnouncements";
import { cn } from "@/lib/utils";
import type { Poll } from "@/types/announcement";

function percentOf(votes: number, total: number): number {
  return total > 0 ? Math.round((votes / total) * 100) : 0;
}

/** A poll inside an announcement: pick and vote, then see the live tally (and change your mind until it closes). */
export function PollVoteBlock({ announcementId, poll }: { announcementId: number; poll: Poll }) {
  const vote = useVotePoll();
  const hasVoted = poll.my_option_ids.length > 0;
  // Local pick while choosing; kept separate from the saved vote so it can be cancelled.
  const [picked, setPicked] = useState<string[] | null>(null);
  const choosing = !poll.closed && (picked !== null || !hasVoted);
  const selection = picked ?? poll.my_option_ids;

  const toggle = (id: string) => {
    if (!poll.multiple) return setPicked([id]);
    setPicked((current) => {
      const base = current ?? poll.my_option_ids;
      return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    });
  };

  const submit = () =>
    vote.mutate({ id: announcementId, optionIds: selection }, { onSuccess: () => setPicked(null) });

  return (
    <div
      className="mt-4 rounded-xl border border-wt-border bg-wt-surface-2/50 p-3.5"
      onClick={(event) => event.stopPropagation()}
    >
      <p className="text-sm font-semibold text-wt-text">{poll.question}</p>
      <p className="mt-0.5 text-xs text-wt-text-muted">
        {poll.closed ? POLL_COPY.closed : poll.multiple ? POLL_COPY.voteHintMultiple : POLL_COPY.voteHint}
      </p>

      <ul className="mt-3 space-y-2">
        {poll.options.map((option) => {
          const percent = percentOf(option.votes, poll.total_voters);
          const mine = poll.my_option_ids.includes(option.id);
          const on = selection.includes(option.id);
          return (
            <li key={option.id}>
              {choosing ? (
                <button
                  type="button"
                  onClick={() => toggle(option.id)}
                  aria-pressed={on}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    on
                      ? "border-[var(--wt-brand)] bg-[color-mix(in_srgb,var(--wt-brand)_10%,transparent)] text-wt-text"
                      : "border-wt-border bg-wt-surface-1 text-wt-text hover:border-wt-border-md"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-4 shrink-0 place-items-center border",
                      poll.multiple ? "rounded" : "rounded-full",
                      on ? "border-[var(--wt-brand)] bg-[var(--wt-brand)] text-[var(--wt-brand-text)]" : "border-wt-border-md"
                    )}
                  >
                    {on ? <Check className="size-3" /> : null}
                  </span>
                  {option.label}
                </button>
              ) : (
                <div className="relative overflow-hidden rounded-lg border border-wt-border bg-wt-surface-1 px-3 py-2 text-sm">
                  <div
                    className="absolute inset-y-0 left-0 bg-[color-mix(in_srgb,var(--wt-brand)_14%,transparent)]"
                    style={{ width: `${percent}%` }}
                    aria-hidden
                  />
                  <div className="relative flex items-center justify-between gap-3 text-wt-text">
                    <span className="flex items-center gap-1.5">
                      {mine ? <Check className="size-3.5 text-[var(--wt-brand)]" aria-label={POLL_COPY.mine} /> : null}
                      {option.label}
                    </span>
                    <span className="tabular-nums text-xs text-wt-text-muted">
                      {option.votes} · {percent}%
                    </span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-wt-text-muted">{POLL_COPY.voters(poll.total_voters)}</span>
        {choosing ? (
          <div className="flex gap-1.5">
            {hasVoted ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => setPicked(null)}>
                Cancel
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="brand" disabled={selection.length === 0 || vote.isPending} onClick={submit}>
              {POLL_COPY.submit}
            </Button>
          </div>
        ) : !poll.closed ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => setPicked(poll.my_option_ids)}>
            {POLL_COPY.change}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
