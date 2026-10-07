"use client";

import { useEffect, useState } from "react";
import { Award, TrendingUp } from "lucide-react";

import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { TrendChart, type TrendPoint } from "@/components/dashboard/pulse/insights/TrendChart";
import { StagePipeline } from "@/components/dashboard/pulse/shared/StagePipeline";
import { StatusPill } from "@/components/dashboard/pulse/shared/StatusPill";
import { cn } from "@/lib/utils";
import { formatMonthLabel, shiftMonth } from "@/utils/pulseMonth";
import { hrmsService } from "@/services/hrms.service";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import type { AllTimeKpiSummary, MonthKpiPoint, MonthlySubmissionItem } from "@/types/kpi";

type Load<T> = { status: "loading" | "done" | "error"; data: T | null };

/** Local copy of the small async-fetch hook used across dashboard pages —
 *  kept file-local rather than shared (see HomePageClient's own copy). */
function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []): Load<T> {
  const [state, setState] = useState<Load<T>>({ status: "loading", data: null });
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await fn();
        if (alive) setState({ status: "done", data });
      } catch {
        if (alive) setState({ status: "error", data: null });
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

function scoreCell(value: number | null): string {
  return value == null ? "—" : value.toFixed(2);
}

function StatTile({ label, value, sub, emphasize = false }: { label: string; value: string; sub?: string | null; emphasize?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 sm:p-5",
        emphasize ? "border-[var(--wt-brand)]/25 bg-[var(--wt-brand-soft)]" : "border-wt-border bg-wt-surface-1"
      )}
    >
      <p className="text-xs font-medium text-wt-text-muted">{label}</p>
      <p className={cn("mt-1.5 font-bold tabular-nums tracking-tight text-wt-text", emphasize ? "text-3xl" : "text-2xl")}>{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-wt-text-muted">{sub}</p> : null}
    </div>
  );
}

/** The 12 months ending at the latest reviewed month, with a gap where a month has nothing. */
function last12Months(months: readonly MonthKpiPoint[]): TrendPoint[] {
  if (months.length === 0) return [];
  const byMonth = new Map(months.map((m) => [m.month, m]));
  const latest = months[months.length - 1].month;
  return Array.from({ length: 12 }, (_, i) => shiftMonth(latest, i - 11)).map((month) => {
    const point = byMonth.get(month);
    return { month, employee: point?.employee_rating ?? null, manager: point?.manager_rating ?? null, final: point?.admin_rating ?? null };
  });
}

/** Exported for reuse by KpiReportsPanel.tsx (admin browsing any employee's summary). */
export function SummarySection({ summary }: { summary: AllTimeKpiSummary }) {
  const trend = last12Months(summary.months ?? []);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Final score" value={scoreCell(summary.admin_rating_average)} sub="Average of approved reviews" emphasize />
        <StatTile label="Your rating" value={summary.employee_rating_display ?? "—"} />
        <StatTile label="Manager rating" value={summary.manager_rating_display ?? "—"} />
        <StatTile label="Reviewed" value={`${summary.reviewed_submissions} / ${summary.total_submissions}`} sub="submissions" />
        <StatTile label="All-time KPI average" value={scoreCell(summary.all_time_kpi_average)} />
        <StatTile
          label="All-time manager KPI average"
          value={scoreCell(summary.all_time_manager_kpi_average)}
        />
      </div>

      {summary.cycles.some((c) => c.six_month_result != null) ? (
        <div>
          <h4 className="text-sm font-semibold text-wt-text">Six-month results</h4>
          <p className="mt-0.5 text-xs text-wt-text-muted">Each result is the average of the monthly final scores inside that cycle.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.cycles.map((cycle) => (
              <div
                key={cycle.cycle_key}
                className={cn(
                  "rounded-2xl border p-4 sm:p-5",
                  cycle.promotion_eligible ? "border-emerald-500/30 bg-emerald-500/8" : "border-wt-border bg-wt-surface-1"
                )}
              >
                <p className="text-xs font-medium text-wt-text-muted">{cycle.cycle_label}</p>
                <p className="mt-1.5 text-3xl font-bold tabular-nums tracking-tight text-wt-text">
                  {cycle.six_month_result == null ? "—" : cycle.six_month_result.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-wt-text-muted">
                  {cycle.months_reviewed ?? 0} of 6 months reviewed
                  {cycle.promotion_eligible ? <span className="ml-2 font-semibold text-emerald-700 dark:text-emerald-300">Promotion eligible</span> : null}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {trend.length > 0 ? (
        <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-5 sm:p-6">
          <h4 className="text-sm font-semibold text-wt-text">Your last 12 months</h4>
          <p className="mt-0.5 text-xs text-wt-text-muted">Self rating, manager rating and final score for each reviewed month.</p>
          <div className="mt-4">
            <TrendChart points={trend} />
          </div>
        </div>
      ) : null}

      {summary.cycles.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold text-wt-text">By cycle</h4>
          <div className="mt-2 overflow-x-auto rounded-2xl border border-wt-border bg-wt-surface-1">
            <WtTable>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Cycle</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Your rating</TableHead>
                  <TableHead>Manager rating</TableHead>
                  <TableHead>Six-month result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.cycles.map((cycle) => (
                  <TableRow key={cycle.cycle_key}>
                    <TableCell className="text-wt-text">{cycle.cycle_label}</TableCell>
                    <TableCell>{cycle.submissions}</TableCell>
                    <TableCell>{cycle.employee_rating_display ?? "—"}</TableCell>
                    <TableCell>{cycle.manager_rating_display ?? "—"}</TableCell>
                    <TableCell className="font-semibold">{scoreCell(cycle.six_month_result ?? cycle.admin_rating_average)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </WtTable>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Exported for reuse by KpiReportsPanel.tsx (admin browsing any employee's history). */
export function HistorySection({ rows }: { rows: MonthlySubmissionItem[] }) {
  if (rows.length === 0) {
    return <EmptyState title="No submission history" description="Your past monthly reviews will show up here." />;
  }

  return (
    <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-[1.1rem] before:top-3 before:w-0.5 before:rounded-full before:bg-wt-border sm:before:left-[1.35rem]">
      {rows.map((row) => (
        <li key={row.id} className="relative pl-12 sm:pl-14">
          <span
            aria-hidden
            className={cn(
              "absolute left-2 top-5 size-4 rounded-full border-4 border-wt-surface-1 ring-2 sm:left-2.5",
              row.review_status === "APPROVED" ? "bg-emerald-500 ring-emerald-500/30" : "bg-[var(--wt-brand)] ring-[var(--wt-brand)]/25"
            )}
          />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border border-wt-border bg-wt-surface-1 p-4 transition-colors hover:border-[var(--wt-brand)]/30 sm:p-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-wt-text">{formatMonthLabel(row.month)}</p>
              {row.cycle_label && row.cycle_label !== formatMonthLabel(row.month) ? <p className="mt-0.5 text-xs text-wt-text-muted">{row.cycle_label}</p> : null}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <StatusPill status={row.review_status} />
                {row.promotion_eligible ? (
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Promotion eligible</span>
                ) : null}
                {row.locked ? <span className="rounded-full border border-wt-border bg-wt-surface-2 px-2.5 py-1 text-xs font-medium text-wt-text-muted">Locked</span> : null}
              </div>
            </div>
            <div className="flex items-center gap-5">
              <StagePipeline row={row} showLabels className="hidden sm:flex" />
              {row.final_score != null ? (
                <div className="text-right">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-wt-text-faint">Score</p>
                  {/* admin_rating_display is the same score as a 2-dp string, not a label. */}
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-wt-text">{row.admin_rating_display ?? row.final_score}</p>
                </div>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Employee-facing all-time KPI summary and submission history — read-only. */
export function MyKpiSummaryPanel() {
  const summary = useLoad<AllTimeKpiSummary>(() => hrmsService.getMyKpiSummary());
  const history = useLoad<MonthlySubmissionItem[]>(() => hrmsService.getMyMonthlySubmissionHistory());

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-wt-text">
          <TrendingUp className="size-4 text-wt-text-faint" />
          All-time KPI summary
        </h3>
        {summary.status === "loading" ? (
          <SectionLoading label="" />
        ) : summary.status === "error" || !summary.data ? (
          <EmptyState title="Couldn't load your summary" description="Try again in a moment." />
        ) : summary.data.total_submissions === 0 ? (
          <EmptyState
            title="No submissions yet"
            description="Your KPI summary will appear once you have a reviewed submission."
          />
        ) : (
          <div className="mt-3">
            <SummarySection summary={summary.data} />
          </div>
        )}
      </div>

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-wt-text">
          <Award className="size-4 text-wt-text-faint" />
          Submission history
        </h3>
        <div className="mt-3">
          {history.status === "loading" ? (
            <SectionLoading label="" />
          ) : history.status === "error" ? (
            <EmptyState title="Couldn't load your history" description="Try again in a moment." />
          ) : (
            <HistorySection rows={history.data ?? []} />
          )}
        </div>
      </div>
    </div>
  );
}
