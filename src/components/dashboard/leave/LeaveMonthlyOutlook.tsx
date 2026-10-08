"use client";

import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LEAVE_OUTLOOK_COPY, NEW_YEAR_MONTH } from "@/constants/leaveOutlookCopy";
import { useLeaveOutlook } from "@/hooks/leave/useLeaveOutlook";
import type { LeaveMonthOutlookItem } from "@/services/hrms.service";
import { cn } from "@/lib/utils";
import { formatBalanceDays } from "@/utils/leaveRequestDisplay";

const EMPTY = "—";

function days(value: number): string {
  return formatBalanceDays(value).amount;
}

/** "Balance at the end of the month", with the shortfall (LOP) called out, never hidden. */
function ClosingCell({ month }: { month: LeaveMonthOutlookItem }) {
  const showIfPending = month.pending_days > 0;
  return (
    <div>
      <p className="font-semibold tabular-nums text-wt-text">{days(month.closing_total)}</p>
      {month.lop_days > 0 ? (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{days(month.lop_days)} LOP</p>
      ) : null}
      {showIfPending ? (
        <p className="text-xs text-wt-text-muted">
          {days(month.closing_total_if_pending)} if pending is approved
          {month.lop_days_if_pending > 0 ? ` (${days(month.lop_days_if_pending)} LOP)` : ""}
        </p>
      ) : null}
    </div>
  );
}

function MonthRow({ month }: { month: LeaveMonthOutlookItem }) {
  return (
    <tr className={cn("border-t border-wt-border/60", month.is_current && "bg-[var(--wt-brand-soft)]/50")}>
      <td className="px-3 py-2.5 text-sm font-medium text-wt-text">
        {month.label}
        {month.is_current ? <span className="ml-2 text-xs font-normal text-wt-text-muted">this month</span> : null}
        {month.month === NEW_YEAR_MONTH && !month.is_current ? (
          <span className="ml-2 rounded-full bg-amber-500/14 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300" title={LEAVE_OUTLOOK_COPY.newYearTagHint}>
            {LEAVE_OUTLOOK_COPY.newYearTag}
          </span>
        ) : null}
      </td>
      <td className="px-3 py-2.5 text-sm tabular-nums text-wt-text-muted">
        {month.credit > 0 ? `+${days(month.credit)}` : EMPTY}
      </td>
      <td className="px-3 py-2.5 text-sm tabular-nums text-wt-text">
        {month.approved_days > 0 ? `−${days(month.approved_days)}` : EMPTY}
      </td>
      <td className="px-3 py-2.5 text-sm tabular-nums text-wt-text-muted">
        {month.pending_days > 0 ? days(month.pending_days) : EMPTY}
      </td>
      <td className="px-3 py-2.5 text-sm">
        <ClosingCell month={month} />
      </td>
    </tr>
  );
}

/** The month-by-month view: what you earn each month and what each coming month's balance is,
 *  including leave already approved for it. The headline balance above is today's running
 *  total; leave approved for a later month comes off *that* month, so it shows here. */
export function LeaveMonthlyOutlook({ enabled = true }: { enabled?: boolean }) {
  const { data, isLoading, isError, refetch } = useLeaveOutlook({ enabled });

  if (isLoading) return <Skeleton className="mb-6 h-48 w-full rounded-xl" aria-hidden />;
  if (isError) {
    return (
      <p className="mb-6 text-sm text-rose-700">
        Could not load your monthly leave plan.{" "}
        <Button type="button" variant="link" className="h-auto p-0 underline" onClick={() => void refetch()}>
          Retry
        </Button>
      </p>
    );
  }
  // An empty or malformed response hides this card; it must never take the whole Leave page down.
  if (!data || !Array.isArray(data.months)) return null;

  return (
    <section className="mb-6 rounded-xl border border-wt-border bg-wt-surface-1 p-4" aria-label="Leave by month">
      <div className="flex items-start gap-2">
        <CalendarRange className="mt-0.5 size-4 text-[var(--wt-brand)]" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-wt-text">Your leave, month by month</h3>
          <p className="mt-0.5 text-xs text-wt-text-muted">
            {data.accrues
              ? `You earn ${days(data.monthly_credit_total)} leaves on ${data.credited_on} (${days(data.monthly_credit_primary)} primary + ${days(data.monthly_credit_secondary)} secondary). `
              : "Your employment type doesn't earn monthly leave. "}
            {LEAVE_OUTLOOK_COPY.capsNote} {LEAVE_OUTLOOK_COPY.newYearNote} Leave approved for a later month comes off that month&apos;s balance, not today&apos;s.
          </p>
        </div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[30rem] text-left">
          <thead>
            <tr className="text-[11px] font-semibold tracking-wider text-wt-text-muted uppercase">
              <th className="px-3 py-1.5">Month</th>
              <th className="px-3 py-1.5">Credited</th>
              <th className="px-3 py-1.5">Approved leave</th>
              <th className="px-3 py-1.5">Pending</th>
              <th className="px-3 py-1.5">Balance at month end</th>
            </tr>
          </thead>
          <tbody>
            {data.months.map((month) => (
              <MonthRow key={`${month.year}-${month.month}`} month={month} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
