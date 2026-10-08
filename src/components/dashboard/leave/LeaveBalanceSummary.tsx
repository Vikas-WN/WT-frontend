"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { LEAVE_OUTLOOK_COPY } from "@/constants/leaveOutlookCopy";
import { useMyLeaveBalance } from "@/hooks/leave/useMyLeaveBalance";
import { formatBalanceDays } from "@/utils/leaveRequestDisplay";
import { CalendarDays, User, Users, Clock, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const TONE = {
  brand: { tile: "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]", card: "border-[color-mix(in_srgb,var(--wt-brand)_30%,transparent)] bg-[var(--wt-brand-soft)]" },
  emerald: { tile: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400", card: "border-wt-border bg-wt-surface-1" },
  sky: { tile: "bg-sky-500/12 text-sky-700 dark:text-sky-300", card: "border-wt-border bg-wt-surface-1" },
  amber: { tile: "bg-amber-500/14 text-amber-700 dark:text-amber-400", card: "border-wt-border bg-wt-surface-1" },
  orange: { tile: "bg-orange-500/12 text-orange-700 dark:text-orange-300", card: "border-wt-border bg-wt-surface-1" },
} as const;

function BalanceStatCard({
  label,
  amount,
  unit,
  icon: Icon,
  tone,
}: {
  label: string | ReactNode;
  amount: string;
  unit: string;
  icon: LucideIcon;
  tone: keyof typeof TONE;
}) {
  const value = Number.parseFloat(amount);
  const decimals = amount.includes(".") ? (amount.split(".")[1]?.length ?? 0) : 0;
  return (
    <div className={`wt-lift flex flex-col gap-3 rounded-2xl border p-4 shadow-[var(--wt-shadow-sm)] sm:p-5 ${TONE[tone].card}`}>
      <div className="flex items-center gap-2.5">
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${TONE[tone].tile}`}>
          <Icon className="size-4" aria-hidden />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-wt-text-muted">{label}</p>
      </div>
      <p className="text-3xl font-semibold leading-none tracking-tight text-wt-text">
        {Number.isFinite(value) ? <AnimatedNumber value={value} decimals={decimals} /> : amount}
        <span className="ml-1.5 text-sm font-medium text-wt-text-faint">{unit}</span>
      </p>
    </div>
  );
}

function BalanceCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-wt-border p-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="mt-3 h-4 w-24" />
          <Skeleton className="mt-2 h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function LeaveBalanceSummary({ enabled = true, selectedType }: { enabled?: boolean; selectedType?: string }) {
  const { data, isLoading, isError, refetch } = useMyLeaveBalance({ enabled });

  if (isLoading) {
    return <BalanceCardsSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-sm text-rose-700">
        Could not load leave balance.{" "}
        <Button type="button" variant="link" className="h-auto p-0 underline" onClick={() => void refetch()}>
          Retry
        </Button>
      </p>
    );
  }

  if (!data?.leave) {
    return null;
  }

  const { primary, secondary, total } = data.leave;
  const compOff = Number(data.comp_off_balance ?? 0);
  const normalizedType = String(selectedType ?? "").trim().toUpperCase();
  const isCompOffOnly = normalizedType === "COMP_OFF";
  // Keep Primary/Secondary balance cards visible for leave/optional (and unknown types).
  const showAll = !isCompOffOnly;

  return (
    <>
    <div className={`grid grid-cols-1 gap-4 ${isCompOffOnly ? "" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
      {showAll ? (
        <BalanceStatCard
          label={
            <span>
              Total Available
              <span title="Comp Off is not included in this total. It is tracked separately." className="inline-flex align-middle ml-1 cursor-help">
                <Info className="size-3.5 text-[var(--wt-brand)]/60" />
              </span>
            </span>
          }
          {...formatBalanceDays(total)}
          icon={CalendarDays}
          tone="brand"
        />
      ) : null}
      {showAll ? (
        <BalanceStatCard
          label="Primary"
          {...formatBalanceDays(primary)}
          icon={User}
          tone="emerald"
        />
      ) : null}
      {showAll ? (
        <BalanceStatCard
          label={
            <span>
              Secondary
              <span title="Includes any leave carried forward from earlier." className="inline-flex align-middle ml-1 cursor-help">
                <Info className="size-3.5 text-[var(--wt-brand)]/60" />
              </span>
            </span>
          }
          {...formatBalanceDays(secondary)}
          icon={Users}
          tone="sky"
        />
      ) : null}
      {(showAll || isCompOffOnly) ? (
        <BalanceStatCard
          label={
            <span>
              Comp Off
              <span title="Comp Off credits are tracked separately and not included in the Total Available balance." className="inline-flex align-middle ml-1.5 cursor-help">
                <Info className="size-3 text-muted-foreground/50" />
              </span>
            </span>
          }
          {...formatBalanceDays(compOff)}
          icon={Clock}
          tone="orange"
        />
      ) : null}
    </div>
    {showAll ? (
      <p className="mt-2 text-xs text-wt-text-muted">
        {LEAVE_OUTLOOK_COPY.balanceNote}
      </p>
    ) : null}
    </>
  );
}
