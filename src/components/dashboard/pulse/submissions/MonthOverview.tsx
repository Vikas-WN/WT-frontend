"use client";

import { CheckCircle2, Clock3, RotateCcw, Star } from "lucide-react";
import type { ComponentType } from "react";

import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { ScoreRing } from "@/components/dashboard/pulse/shared/ScoreRing";
import { statusMeta, TONE_DOT_CLASS } from "@/components/dashboard/pulse/shared/submissionStatus";
import type { MonthStats } from "@/components/dashboard/pulse/submissions/submissionsModel";
import { cn } from "@/lib/utils";
import { formatMonthLabel } from "@/utils/pulseMonth";

const SEGMENT_FILL: Record<string, string> = {
  neutral: "bg-wt-text-faint/50",
  info: "bg-sky-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  success: "bg-emerald-500",
};

function Tile({
  icon: Icon,
  label,
  value,
  decimals = 0,
  hint,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | null;
  decimals?: number;
  hint: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-4 transition-shadow hover:shadow-[var(--wt-shadow-md)]">
      <div className="flex items-center gap-2.5">
        <span className={cn("flex size-8 items-center justify-center rounded-lg", tone)}>
          <Icon className="size-4" aria-hidden />
        </span>
        <p className="text-xs font-medium text-wt-text-muted">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-wt-text">
        {value == null ? "—" : <AnimatedNumber value={value} decimals={decimals} />}
      </p>
      <p className="mt-0.5 text-xs text-wt-text-faint">{hint}</p>
    </div>
  );
}

/** The month at a glance: how far along the cycle is (ring + stacked status bar) and the four numbers HR watches. */
export function MonthOverview({ month, stats, loading }: { month: string; stats: MonthStats; loading: boolean }) {
  const pct = stats.total ? Math.round((stats.approved / stats.total) * 100) : 0;
  return (
    <section aria-label={`${formatMonthLabel(month)} overview`} className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,2fr)]">
      <div className="relative overflow-hidden rounded-3xl border border-wt-border bg-wt-surface-1 p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_120%_at_0%_0%,color-mix(in_srgb,var(--wt-brand)_9%,transparent),transparent_62%)]"
        />
        <div className="relative flex items-center gap-5">
          <ScoreRing percent={pct} size={92} stroke={9} tone={pct === 100 && stats.total > 0 ? "success" : "brand"} label="Finalised">
            <span className="text-xl font-bold tabular-nums text-wt-text">{loading ? "…" : `${pct}%`}</span>
          </ScoreRing>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wt-brand)]">{formatMonthLabel(month)}</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-wt-text">
              {stats.total === 0 ? "No submissions yet" : `${stats.approved} of ${stats.total} finalised`}
            </p>
            <p className="mt-0.5 text-sm text-wt-text-muted">
              {stats.total === 0 ? "Nothing has been submitted for this month." : stats.withManagers > 0 ? `${stats.withManagers} still with managers.` : "Nothing waiting on managers."}
            </p>
          </div>
        </div>
        {stats.segments.length > 0 ? (
          <div className="relative mt-5">
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-wt-surface-3" role="img" aria-label="Submissions by status">
              {stats.segments.map((s) => (
                <span
                  key={s.status}
                  className={cn("h-full first:rounded-l-full last:rounded-r-full transition-[flex-grow] duration-700", SEGMENT_FILL[s.tone])}
                  style={{ flexGrow: s.count, flexBasis: 0 }}
                  title={`${statusMeta(s.status).label}: ${s.count}`}
                />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {stats.segments.map((s) => (
                <li key={s.status} className="flex items-center gap-1.5 text-xs text-wt-text-muted">
                  <span aria-hidden className={cn("size-2 rounded-full", TONE_DOT_CLASS[s.tone])} />
                  {statusMeta(s.status).label}
                  <span className="font-semibold tabular-nums text-wt-text">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile icon={Clock3} label="With managers" value={stats.withManagers} hint="waiting for a decision" tone="bg-sky-500/12 text-sky-600 dark:text-sky-300" />
        <Tile icon={RotateCcw} label="Sent back" value={stats.sentBack} hint="to employee or managers" tone="bg-amber-500/12 text-amber-600 dark:text-amber-300" />
        <Tile icon={CheckCircle2} label="Finalised" value={stats.approved} hint="approved by HR" tone="bg-emerald-500/12 text-emerald-600 dark:text-emerald-300" />
        <Tile icon={Star} label="Average score" value={stats.averageScore} decimals={2} hint="of finalised reviews" tone="bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]" />
      </div>
    </section>
  );
}
