"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { LEAVE_YEAR_COPY as COPY } from "@/constants/leaveYearSummary";
import { useMyLeaveBalance } from "@/hooks/leave/useMyLeaveBalance";
import { formatBalanceDays } from "@/utils/leaveRequestDisplay";

function Figure({ label, hint, value, sub }: { label: string; hint: string; value: number; sub?: string }) {
  return (
    <div className="min-w-0 flex-1 px-4 py-3" title={hint}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-wt-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums leading-none text-wt-text">
        <AnimatedNumber value={value} decimals={Number.isInteger(value) ? 0 : 1} />
      </p>
      {sub ? <p className="mt-1.5 text-xs text-wt-text-muted">{sub}</p> : null}
    </div>
  );
}

/** This calendar year in three figures: credited, taken (approved, and pending approval), and the balance. */
export function LeaveYearSummaryStrip() {
  const { data, isLoading } = useMyLeaveBalance();
  if (isLoading) return <Skeleton className="mb-6 h-24 w-full rounded-2xl" aria-hidden />;
  const year = data?.year_summary;
  if (!year) return null;
  // Tolerate a backend that has not been updated yet: derive the new figures from the old ones.
  const credited = year.credited ?? year.carried_forward + year.accrued;
  const approved = year.taken_approved ?? year.leaves_taken;
  const pending = year.taken_pending ?? 0;
  const carried = year.carried_forward > 0 ? COPY.creditedIncludes(formatBalanceDays(year.carried_forward).amount) : undefined;
  return (
    <section aria-label={COPY.heading(year.year)} className="mb-6 rounded-2xl border border-wt-border bg-wt-surface-1 shadow-[var(--wt-shadow-sm)]">
      <p className="border-b border-wt-border px-4 py-2 text-sm font-semibold text-wt-text">{COPY.heading(year.year)}</p>
      <div className="flex flex-col divide-y divide-wt-border sm:flex-row sm:divide-x sm:divide-y-0">
        <Figure label={COPY.credited} hint={COPY.creditedHint} value={credited} sub={carried} />
        <Figure
          label={COPY.taken}
          hint={COPY.takenHint}
          value={approved}
          sub={`${formatBalanceDays(approved).amount} ${COPY.approved} · ${formatBalanceDays(pending).amount} ${COPY.pending}`}
        />
        <Figure label={COPY.balance} hint={COPY.balanceHint} value={year.balance} />
      </div>
    </section>
  );
}
