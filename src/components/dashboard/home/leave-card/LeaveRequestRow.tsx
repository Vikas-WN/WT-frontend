import { RequestStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import { cn } from "@/lib/utils";
import { formatUserRequestTypeLabel } from "@/utils/actionToast";
import type { HomeLeaveRequestItem } from "@/utils/homeLeaveRequests";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

function formatRange(start: Date, end: Date): string {
  const day = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].charAt(0)}${MONTHS[d.getMonth()].slice(1).toLowerCase()}`;
  if (start.getTime() === end.getTime()) return `${day(start)} ${start.getFullYear()}`;
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} – ${day(end)} ${end.getFullYear()}`;
  }
  return `${day(start)} – ${day(end)} ${end.getFullYear()}`;
}

/** A request as a small date tile (day over month) beside its type, dates and status — pending glows warm, approved cool. */
export function LeaveRequestRow({ item }: { item: HomeLeaveRequestItem }) {
  const pending = item.status !== "APPROVED";
  const range = formatRange(item.start, item.end);
  return (
    <li className="flex items-center gap-3">
      <span
        className={cn(
          "flex size-10 shrink-0 flex-col items-center justify-center rounded-xl leading-none",
          pending ? "bg-amber-500/12 text-amber-800 dark:text-amber-300" : "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300"
        )}
        aria-hidden
      >
        <span className="text-base font-semibold tabular-nums">{item.start.getDate()}</span>
        <span className="mt-0.5 text-[9px] font-semibold tracking-wider">{MONTHS[item.start.getMonth()]}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-wt-text">
          {formatUserRequestTypeLabel(item.type, item.isHalfDay)}
        </span>
        <span className="block truncate text-xs text-wt-text-muted">{range}</span>
      </span>
      <RequestStatusBadge status={item.status} className="shrink-0" />
    </li>
  );
}
