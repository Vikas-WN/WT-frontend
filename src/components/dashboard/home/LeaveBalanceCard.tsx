"use client";

import { CalendarDays } from "lucide-react";
import Link from "next/link";

import { LeaveRequestRow } from "@/components/dashboard/home/leave-card/LeaveRequestRow";
import { CardMessage, CardSkeleton, HomeCard } from "@/components/dashboard/home/HomeCard";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { HOME_LEAVE_CARD, LEAVE_COLORS } from "@/constants/homeLeaveCard";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { useHomeLeaveSummary } from "@/hooks/dashboard/useHomeLeaveSummary";
import { cn } from "@/lib/utils";
import { formatBalanceDays } from "@/utils/leaveRequestDisplay";

function Stat({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-sm text-wt-text-muted">
        <span className={cn("size-2 rounded-[3px]", dot)} aria-hidden />
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-wt-text">{formatBalanceDays(value).amount}</p>
    </div>
  );
}

function Tally({ label, value }: { label: string; value: number }) {
  return (
    <p className="text-sm text-wt-text-muted">
      {label} <span className="font-semibold tabular-nums text-wt-text">{formatBalanceDays(value).amount}</span>
    </p>
  );
}

/** Home card "My leave": what is left (big), how it splits, the year so far, and what is coming up. */
export function LeaveBalanceCard() {
  const s = useHomeLeaveSummary();
  const total = s.yearSummary?.balance ?? s.total;
  const split = Math.max(s.primary, 0) + Math.max(s.secondary, 0);
  const primaryShare = split > 0 ? (Math.max(s.primary, 0) / split) * 100 : 0;
  const next = s.items[0];
  const year = s.yearSummary;

  return (
    <HomeCard title={HOME_LEAVE_CARD.title} href={`${DASHBOARD_ROUTES.leave}?tab=my`} cta={HOME_LEAVE_CARD.cta}>
      {s.balanceStatus === "loading" ? (
        <CardSkeleton />
      ) : s.balanceStatus === "error" ? (
        <CardMessage text={HOME_LEAVE_CARD.unavailable} />
      ) : (
        <div className="flex h-full flex-col">
          <p className="flex items-baseline gap-2">
            <span className="text-[2.5rem] font-bold leading-none tracking-[-0.03em] tabular-nums text-wt-text">
              <AnimatedNumber value={total} decimals={Number.isInteger(total) ? 0 : 1} />
            </span>
            <span className="text-base text-wt-text-muted">{HOME_LEAVE_CARD.ringCaption}</span>
          </p>

          <div className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full bg-wt-surface-3" role="img" aria-label={`${formatBalanceDays(s.primary).amount} primary, ${formatBalanceDays(s.secondary).amount} secondary`}>
            {split > 0 ? (
              <>
                <span className="h-full rounded-full" style={{ width: `${primaryShare}%`, background: LEAVE_COLORS.primary.stroke }} />
                <span className="h-full flex-1 rounded-full" style={{ background: LEAVE_COLORS.secondary.stroke }} />
              </>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <Stat label={HOME_LEAVE_CARD.primaryLabel} value={s.primary} dot={LEAVE_COLORS.primary.dot} />
            <Stat label={HOME_LEAVE_CARD.secondaryLabel} value={s.secondary} dot={LEAVE_COLORS.secondary.dot} />
            <Stat label={HOME_LEAVE_CARD.compOffLabel} value={s.compOff} dot={LEAVE_COLORS.compOff.dot} />
          </div>

          {year ? (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-wt-border pt-4">
              <Tally label={HOME_LEAVE_CARD.openingShort} value={year.carried_forward} />
              <Tally label={HOME_LEAVE_CARD.accruedShort} value={year.accrued} />
              <Tally label={HOME_LEAVE_CARD.takenShort} value={year.taken_approved ?? year.leaves_taken} />
            </div>
          ) : null}

          <div className="mt-auto pt-4">
            {s.requestsStatus === "ready" && next ? (
              <ul>
                <LeaveRequestRow item={next} />
              </ul>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-wt-surface-2 px-3.5 py-3">
                <CalendarDays className="size-4 shrink-0 text-wt-text-muted" aria-hidden />
                <span className="min-w-0 flex-1 text-sm text-wt-text-muted">{HOME_LEAVE_CARD.requestsEmpty}</span>
                <Link href={DASHBOARD_ROUTES.leave} className="shrink-0 text-sm font-semibold text-[var(--wt-brand)] hover:underline">
                  {HOME_LEAVE_CARD.requestsEmptyCta}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </HomeCard>
  );
}
