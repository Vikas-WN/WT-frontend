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

const SEGMENT_COLORS = ["bg-[var(--wt-brand)]", "bg-amber-500", "bg-emerald-500"] as const;

function Figure({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="min-w-0">
      <p className="text-2xl font-semibold tabular-nums text-wt-text">
        <AnimatedNumber value={value} decimals={Number.isInteger(value) ? 0 : 1} />
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-wt-text-muted">
        <span className={cn("size-1.5 shrink-0 rounded-full", dot)} aria-hidden />
        {label}
      </p>
    </div>
  );
}

function YearFigure({ label, value, hint, strong = false }: { label: string; value: number; hint: string; strong?: boolean }) {
  return (
    <div className="min-w-0 text-center" title={hint}>
      <p className="truncate text-[11px] font-medium text-wt-text-muted">{label}</p>
      <p className={cn("mt-1 text-2xl tabular-nums", strong ? "font-bold text-wt-brand" : "font-semibold text-wt-text")}>
        <AnimatedNumber value={value} decimals={Number.isInteger(value) ? 0 : 1} />
      </p>
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
          {s.yearSummary ? (
            <div className="grid grid-cols-4 gap-3">
              <YearFigure label={HOME_LEAVE_CARD.carriedForwardLabel} value={s.yearSummary.carried_forward} hint={HOME_LEAVE_CARD.carriedForwardHint} />
              <YearFigure label={HOME_LEAVE_CARD.accruedYearLabel} value={s.yearSummary.accrued} hint={HOME_LEAVE_CARD.accruedYearHint} />
              <YearFigure label={HOME_LEAVE_CARD.takenLabel} value={s.yearSummary.leaves_taken} hint={HOME_LEAVE_CARD.takenHint} />
              <YearFigure label={HOME_LEAVE_CARD.balanceLabel} value={s.yearSummary.balance} hint={HOME_LEAVE_CARD.balanceHint} strong />
            </div>
          ) : null}
          <div className={cn("grid grid-cols-3 gap-4", s.yearSummary && "mt-4")}>
            <Figure label={HOME_LEAVE_CARD.primaryLabel} value={s.primary} dot={SEGMENT_COLORS[0]} />
            <Figure label={HOME_LEAVE_CARD.secondaryLabel} value={s.secondary} dot={SEGMENT_COLORS[1]} />
            <Figure label={HOME_LEAVE_CARD.compOffLabel} value={s.compOff} dot={SEGMENT_COLORS[2]} />
          </div>
          <SplitBar values={[s.primary, s.secondary, s.compOff]} />
          <p className="mt-2 text-[11px] text-wt-text-faint">{HOME_LEAVE_CARD.breakupNote}</p>
          <div className="mt-3 border-t border-wt-border pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-wt-text-muted">{HOME_LEAVE_CARD.requestsHeading}</p>
            <RequestsSection />
          </div>
        </div>
      )}
    </HomeCard>
  );
}
