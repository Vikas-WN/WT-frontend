"use client";

import { Plane } from "lucide-react";

import { CardMessage, CardSkeleton, HomeCard } from "@/components/dashboard/home/HomeCard";
import { RequestStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { HOME_LEAVE_CARD, HOME_LEAVE_MAX_ROWS } from "@/constants/homeLeaveCard";
import { useHomeLeaveSummary } from "@/hooks/dashboard/useHomeLeaveSummary";
import { cn } from "@/lib/utils";
import { formatUserRequestTypeLabel } from "@/utils/actionToast";
import { formatApiDateDisplay } from "@/utils/apiDate";
import type { HomeLeaveRequestItem } from "@/utils/homeLeaveRequests";
import { formatBalanceDays } from "@/utils/leaveRequestDisplay";

const SEGMENT_COLORS = ["bg-[var(--wt-brand)]", "bg-amber-500", "bg-emerald-500"] as const;

function Figure({ label, value, hint, dot }: { label: string; value: number; hint?: string; dot: string }) {
  return (
    <div className="min-w-0">
      <p className="text-2xl font-semibold tabular-nums text-wt-text">
        <AnimatedNumber value={value} decimals={Number.isInteger(value) ? 0 : 1} />
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-wt-text-muted">
        <span className={cn("size-1.5 shrink-0 rounded-full", dot)} aria-hidden />
        {label}
      </p>
      {hint ? <p className="mt-0.5 truncate text-[11px] text-wt-text-faint">{hint}</p> : null}
    </div>
  );
}

function SplitBar({ values }: { values: number[] }) {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0);
  if (total <= 0) return null;
  return (
    <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-wt-surface-3" aria-hidden>
      {values.map((v, i) =>
        v > 0 ? <div key={i} className={SEGMENT_COLORS[i]} style={{ width: `${(v / total) * 100}%` }} /> : null
      )}
    </div>
  );
}

function RequestRow({ item }: { item: HomeLeaveRequestItem }) {
  const range = item.from === item.to ? formatApiDateDisplay(item.from) : `${formatApiDateDisplay(item.from)} – ${formatApiDateDisplay(item.to)}`;
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span className="min-w-0 truncate text-wt-text">
        {formatUserRequestTypeLabel(item.type, item.isHalfDay)}
        <span className="ml-1.5 text-xs text-wt-text-muted">{range}</span>
      </span>
      <RequestStatusBadge status={item.status} className="shrink-0" />
    </li>
  );
}

function RequestsSection() {
  const { items, requestsStatus } = useHomeLeaveSummary();
  if (requestsStatus === "loading") return <CardSkeleton />;
  if (requestsStatus === "error") return <p className="text-xs text-wt-text-muted">{HOME_LEAVE_CARD.requestsError}</p>;
  if (items.length === 0) return <p className="text-xs text-wt-text-muted">{HOME_LEAVE_CARD.requestsEmpty}</p>;
  const shown = items.slice(0, HOME_LEAVE_MAX_ROWS);
  return (
    <>
      <ul className="space-y-1.5">
        {shown.map((item) => (
          <RequestRow key={item.id} item={item} />
        ))}
      </ul>
      {items.length > shown.length ? (
        <p className="mt-1.5 text-xs text-wt-text-faint">{HOME_LEAVE_CARD.moreRequests(items.length - shown.length)}</p>
      ) : null}
    </>
  );
}

/** Home card: what I can take (accrued + carried forward), comp-off, and my open / upcoming leave requests. */
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
        <div>
          <div className="grid grid-cols-3 gap-4">
            <Figure
              label={HOME_LEAVE_CARD.accruedLabel}
              value={s.accrued}
              dot={SEGMENT_COLORS[0]}
              hint={HOME_LEAVE_CARD.accruedBreakdown(formatBalanceDays(s.primary).amount, formatBalanceDays(s.secondary).amount)}
            />
            <Figure label={HOME_LEAVE_CARD.carryLabel} value={s.carryForward} dot={SEGMENT_COLORS[1]} />
            <Figure label={HOME_LEAVE_CARD.compOffLabel} value={s.compOff} dot={SEGMENT_COLORS[2]} />
          </div>
          <SplitBar values={[s.accrued, s.carryForward, s.compOff]} />
          <p className="mt-2 text-xs text-wt-text-muted" title={HOME_LEAVE_CARD.totalHint}>
            {HOME_LEAVE_CARD.totalLabel}: <span className="font-medium text-wt-text">{formatBalanceDays(s.total).amount}</span>
          </p>
          <div className="mt-3 border-t border-wt-border pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-wt-text-muted">{HOME_LEAVE_CARD.requestsHeading}</p>
            <RequestsSection />
          </div>
        </div>
      )}
    </HomeCard>
  );
}
