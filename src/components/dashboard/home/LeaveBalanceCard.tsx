"use client";

import { Plane } from "lucide-react";

import { CardMessage, CardSkeleton, HomeCard } from "@/components/dashboard/home/HomeCard";
import { LeaveRequestsList } from "@/components/dashboard/home/leave-card/LeaveRequestsList";
import { LeaveRing } from "@/components/dashboard/home/leave-card/LeaveRing";
import { LeaveYearStats } from "@/components/dashboard/home/leave-card/LeaveYearStats";
import { HOME_LEAVE_CARD, LEAVE_COLORS } from "@/constants/homeLeaveCard";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { useHomeLeaveSummary } from "@/hooks/dashboard/useHomeLeaveSummary";
import { cn } from "@/lib/utils";
import { formatBalanceDays } from "@/utils/leaveRequestDisplay";

function Legend({ items }: { items: Array<{ label: string; value: number; dot: string; hint?: string }> }) {
  return (
    <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5 text-xs text-wt-text-muted" title={i.hint}>
          <span className={cn("size-2 rounded-full", i.dot)} aria-hidden />
          {i.label}
          <span className="font-semibold tabular-nums text-wt-text">{formatBalanceDays(i.value).amount}</span>
        </li>
      ))}
    </ul>
  );
}

/** Home card: how much leave is left (ring), where it came from and went, the primary/secondary/comp-off split, and what's coming up. */
export function LeaveBalanceCard() {
  const s = useHomeLeaveSummary();
  return (
    <HomeCard
      title={HOME_LEAVE_CARD.title}
      tone="emerald"
      icon={<Plane className="size-4" />}
      href={`${DASHBOARD_ROUTES.leave}?tab=my`}
      cta={HOME_LEAVE_CARD.cta}
    >
      {s.balanceStatus === "loading" ? (
        <CardSkeleton />
      ) : s.balanceStatus === "error" ? (
        <CardMessage text={HOME_LEAVE_CARD.unavailable} />
      ) : (
        <div className="@container">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <LeaveRing primary={s.primary} secondary={s.secondary} balance={s.yearSummary?.balance ?? s.total} />
            {s.yearSummary ? <LeaveYearStats summary={s.yearSummary} /> : null}
          </div>
          <Legend
            items={[
              { label: HOME_LEAVE_CARD.primaryLabel, value: s.primary, dot: LEAVE_COLORS.primary.dot },
              { label: HOME_LEAVE_CARD.secondaryLabel, value: s.secondary, dot: LEAVE_COLORS.secondary.dot, hint: HOME_LEAVE_CARD.secondaryHint },
              { label: HOME_LEAVE_CARD.compOffLabel, value: s.compOff, dot: LEAVE_COLORS.compOff.dot, hint: HOME_LEAVE_CARD.compOffHint },
            ]}
          />
          <div className="mt-4 border-t border-wt-border pt-3.5">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-wt-text-muted">{HOME_LEAVE_CARD.requestsHeading}</p>
            <LeaveRequestsList status={s.requestsStatus} items={s.items} />
          </div>
        </div>
      )}
    </HomeCard>
  );
}
