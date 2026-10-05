"use client";

import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";

import { ReviewWorkspace } from "@/components/dashboard/pulse/manager/team/ReviewWorkspace";
import { TeamList } from "@/components/dashboard/pulse/manager/team/TeamList";
import { MonthSwitcher } from "@/components/dashboard/pulse/shared/MonthSwitcher";
import { WindowPill } from "@/components/dashboard/pulse/shared/WindowPill";
import { useSubmissionLink } from "@/components/dashboard/pulse/useSubmissionLink";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { useManagerTeam, usePulseWindow } from "@/hooks/pulse/usePulse";
import { notifyError } from "@/lib/notify";
import { currentMonthKey, formatMonthLabel } from "@/utils/pulseMonth";

/** Team reviews, month by month: pick a month, choose a team member, rate
 *  each KPI and value next to their own rating, then approve or send back. */
export function ManagerTeamReviewPanel() {
  const team = useManagerTeam();
  const rows = useMemo(() => team.data ?? [], [team.data]);
  const pendingMonths = useMemo(() => new Set(rows.map((r) => r.month)), [rows]);

  // Notification links open one submission (and so its month) directly.
  const { linkedId, clear: clearLink } = useSubmissionLink();
  const linked = linkedId != null ? (rows.find((r) => r.id === linkedId) ?? null) : null;

  // Default to the newest month with reviews waiting; else this month.
  const newestPending = useMemo(() => [...pendingMonths].sort().at(-1) ?? null, [pendingMonths]);
  const [chosenMonth, setChosenMonth] = useState<string | null>(null);
  const month = chosenMonth ?? linked?.month ?? newestPending ?? currentMonthKey();

  const windowQ = usePulseWindow(month, "team");
  const monthRows = rows.filter((r) => r.month === month);
  const [chosenId, setChosenId] = useState<number | null>(null);
  const selected = monthRows.find((r) => r.id === (chosenId ?? linked?.id ?? -1)) ?? monthRows[0] ?? null;

  useEffect(() => {
    if (linkedId == null || team.isLoading || linked) return;
    notifyError("That review isn't waiting on you anymore — it may already have been reviewed.");
    clearLink();
  }, [linkedId, team.isLoading, linked, clearLink]);

  const pick = (id: number) => {
    setChosenId(id);
    if (linkedId != null) clearLink();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthSwitcher value={month} onChange={(m) => { setChosenMonth(m); setChosenId(null); }} marks={pendingMonths} />
        <WindowPill status={windowQ.data} loading={windowQ.isLoading} openLabel="Reviews open" closedLabel="Review window closed" />
      </div>

      {team.isLoading ? (
        <SectionLoading label="" />
      ) : monthRows.length === 0 ? (
        <EmptyState
          title={`Nothing waiting for ${formatMonthLabel(month)}`}
          description={pendingMonths.size > 0 ? "Other months have reviews waiting — look for the dots in the month picker." : "No team submissions are waiting on your review."}
        />
      ) : (
        <>
          {windowQ.data && !windowQ.data.open ? (
            <p className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-wt-text-muted">
              <Lock className="size-4 shrink-0" aria-hidden /> The manager window for {formatMonthLabel(month)} is closed — you can read these reviews but not submit until HR opens it.
            </p>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <TeamList rows={monthRows} selectedId={selected?.id ?? null} onSelect={pick} />
            {selected ? (
              <ReviewWorkspace
                key={selected.id}
                submission={selected}
                canAct={Boolean(windowQ.data?.open)}
                onDone={() => {
                  setChosenId(null);
                  if (linkedId != null) clearLink();
                }}
              />
            ) : (
              <EmptyState title="Pick someone" description="Choose a team member to review." />
            )}
          </div>
        </>
      )}
    </div>
  );
}
