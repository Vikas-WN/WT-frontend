"use client";

import { CheckCircle2, TriangleAlert } from "lucide-react";
import { useLeaveImpact } from "@/hooks/leave/useLeaveImpact";
import { cn } from "@/lib/utils";

/** Shown under the dates while requesting leave: is it covered by the balance, or how many of
 *  the days would be Loss of Pay — so nobody finds out only after approval. */
export function LeaveImpactNotice({
  fromDate,
  toDate,
  isHalfDay,
  enabled,
}: {
  fromDate: string;
  toDate: string;
  isHalfDay: boolean;
  enabled: boolean;
}) {
  const { data, isFetching } = useLeaveImpact({ fromDate, toDate, isHalfDay, enabled });
  if (!enabled || (!data && !isFetching)) return null;
  if (!data) return <p className="mt-4 text-xs text-wt-text-muted">Checking against your balance…</p>;

  const lop = data.lop_days > 0;
  const Icon = lop ? TriangleAlert : CheckCircle2;
  return (
    <div
      role="status"
      className={cn(
        "mt-4 flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm",
        lop
          ? "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <p className="font-medium">{data.message}</p>
        {data.leave_days > 0 ? (
          <p className="mt-0.5 text-xs opacity-80">
            Balance after this leave: {data.balance_after} day(s). Leaves are credited 1.5 on the 1st of every month.
          </p>
        ) : null}
      </div>
    </div>
  );
}
