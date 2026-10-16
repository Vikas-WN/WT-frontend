"use client";

import { CalendarCheck, Hourglass, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { HOME_LEAVE_CARD } from "@/constants/homeLeaveCard";
import { cn } from "@/lib/utils";
import type { LeaveYearSummary } from "@/services/hrms.service";

function Stat({ icon, tone, label, short, hint, value }: { icon: ReactNode; tone: string; label: string; short: string; hint: string; value: number }) {
  return (
    <li className="flex items-center gap-2.5" title={hint}>
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl", tone)} aria-hidden>
        {icon}
      </span>
      {/* Narrow card: the short form fits beside the icon; the full label appears once the card is wide enough. */}
      <span className="min-w-0 flex-1 truncate text-[13px] text-wt-text-muted">
        <span className="@sm:hidden">{short}</span>
        <span className="hidden @sm:inline">{label}</span>
      </span>
      <span className="text-base font-semibold tabular-nums text-wt-text">
        <AnimatedNumber value={value} decimals={Number.isInteger(value) ? 0 : 1} />
      </span>
    </li>
  );
}

/** This year in three numbers: what has been credited, what is taken (approved) and what is waiting for approval. */
export function LeaveYearStats({ summary }: { summary: LeaveYearSummary }) {
  return (
    <ul className="min-w-0 flex-1 space-y-2.5">
      <Stat
        icon={<TrendingUp className="size-4" />}
        tone="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
        label={HOME_LEAVE_CARD.creditedLabel}
        short={HOME_LEAVE_CARD.creditedShort}
        hint={HOME_LEAVE_CARD.creditedHint}
        value={summary.credited ?? summary.carried_forward + summary.accrued}
      />
      <Stat
        icon={<CalendarCheck className="size-4" />}
        tone="bg-sky-500/12 text-sky-700 dark:text-sky-300"
        label={HOME_LEAVE_CARD.takenLabel}
        short={HOME_LEAVE_CARD.takenShort}
        hint={HOME_LEAVE_CARD.takenHint}
        value={summary.taken_approved ?? summary.leaves_taken}
      />
      <Stat
        icon={<Hourglass className="size-4" />}
        tone="bg-amber-500/12 text-amber-700 dark:text-amber-400"
        label={HOME_LEAVE_CARD.pendingLabel}
        short={HOME_LEAVE_CARD.pendingShort}
        hint={HOME_LEAVE_CARD.pendingHint}
        value={summary.taken_pending ?? 0}
      />
    </ul>
  );
}
