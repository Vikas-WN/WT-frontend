"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyLeaveBalance } from "@/hooks/leave/useMyLeaveBalance";
import { formatBalanceDays } from "@/utils/leaveRequestDisplay";
import { CalendarDays, RotateCcw, User, Users, Clock, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

function BalanceStatCard({
  label,
  amount,
  unit,
  icon: Icon,
  className,
}: {
  label: string | ReactNode;
  amount: string;
  unit: string;
  icon: LucideIcon;
  className: string;
}) {
  return (
    <div
      className={`rounded-xl border border-wt-border/40 dark:border-white/20 bg-wt-surface-1 p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-wt-surface-1/70 shadow-sm ring-1 ring-wt-border/20">
          <Icon className="size-[18px]" aria-hidden />
        </div>
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
      </div>
      <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
        {amount}
        <span className="ml-1.5 text-base font-medium text-muted-foreground/70">{unit}</span>
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

  const { primary, secondary, carry_forward, total } = data.leave;
  const compOff = Number(data.comp_off_balance ?? 0);
  const normalizedType = String(selectedType ?? "").trim().toUpperCase();
  const isCompOffOnly = normalizedType === "COMP_OFF";
  // Keep Primary/Secondary balance cards visible for leave/optional (and unknown types).
  const showAll = !isCompOffOnly;

  return (
    <div className={`grid grid-cols-1 gap-4 ${isCompOffOnly ? "" : "sm:grid-cols-2 lg:grid-cols-5"}`}>
      {showAll ? (
        <BalanceStatCard
          label={
            <span>
              Total Available
              <span title="Comp Off is not included in this total. It is tracked separately." className="inline-flex align-middle ml-1 cursor-help">
                <Info className="size-3.5 text-sky-600/60" />
              </span>
            </span>
          }
          {...formatBalanceDays(total)}
          icon={CalendarDays}
          className="bg-sky-50 text-sky-700"
        />
      ) : null}
      {showAll ? (
        <BalanceStatCard
          label="Primary"
          {...formatBalanceDays(primary)}
          icon={User}
          className="bg-emerald-50 text-emerald-700"
        />
      ) : null}
      {showAll ? (
        <BalanceStatCard
          label="Secondary"
          {...formatBalanceDays(secondary)}
          icon={Users}
          className="bg-violet-50 text-violet-700"
        />
      ) : null}
      {showAll ? (
        <BalanceStatCard
          label="Carry Forward"
          {...formatBalanceDays(carry_forward)}
          icon={RotateCcw}
          className="bg-amber-50 text-amber-800"
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
          className="bg-orange-50/40 text-orange-700"
        />
      ) : null}
    </div>
  );
}
