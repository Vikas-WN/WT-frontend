"use client";

import { CalendarPlus } from "lucide-react";
import Link from "next/link";

import { LeaveRequestRow } from "@/components/dashboard/home/leave-card/LeaveRequestRow";
import { HOME_LEAVE_CARD, HOME_LEAVE_MAX_ROWS } from "@/constants/homeLeaveCard";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import type { HomeLeaveRequestItem } from "@/utils/homeLeaveRequests";

function Skeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="size-10 animate-pulse rounded-xl bg-wt-surface-3" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/2 animate-pulse rounded bg-wt-surface-3" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-wt-surface-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Pending and upcoming leave, or a friendly nudge to apply when there is none. */
export function LeaveRequestsList({ status, items }: { status: "loading" | "error" | "ready"; items: readonly HomeLeaveRequestItem[] }) {
  if (status === "loading") return <Skeleton />;
  if (status === "error") return <p className="text-xs text-wt-text-muted">{HOME_LEAVE_CARD.requestsError}</p>;
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-wt-surface-2/60 px-3 py-2.5">
        <span className="text-[13px] text-wt-text-muted">{HOME_LEAVE_CARD.requestsEmpty}</span>
        <Link
          href={DASHBOARD_ROUTES.leave}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--wt-brand)] hover:underline"
        >
          <CalendarPlus className="size-3.5" aria-hidden />
          {HOME_LEAVE_CARD.requestsEmptyCta}
        </Link>
      </div>
    );
  }
  const shown = items.slice(0, HOME_LEAVE_MAX_ROWS);
  return (
    <>
      <ul className="space-y-2.5">
        {shown.map((item) => (
          <LeaveRequestRow key={item.id} item={item} />
        ))}
      </ul>
      {items.length > shown.length ? (
        <p className="mt-2 text-xs font-medium text-wt-text-faint">{HOME_LEAVE_CARD.moreRequests(items.length - shown.length)}</p>
      ) : null}
    </>
  );
}
