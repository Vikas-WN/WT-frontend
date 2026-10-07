"use client";

import { useMemo, useState } from "react";
import { Award, Download, Sigma, Users } from "lucide-react";
import type { ComponentType } from "react";

import { BellCurveChart } from "@/components/dashboard/pulse/insights/BellCurveChart";
import { TrendChart, type TrendPoint } from "@/components/dashboard/pulse/insights/TrendChart";
import { DropdownSelect } from "@/components/dashboard/ui/DropdownSelect";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SearchInput } from "@/components/dashboard/ui/SearchInput";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Button } from "@/components/ui/button";
import { usePulseInsights } from "@/hooks/pulse/usePulse";
import { cn } from "@/lib/utils";
import { downloadCsvFile } from "@/utils/parseSpreadsheetFile";
import type { InsightsCycleReport, InsightsEmployee } from "@/types/kpi";

const CARD = "rounded-2xl border border-wt-border bg-wt-surface-1 p-5 sm:p-6";

function Stat({
  icon: Icon,
  label,
  value,
  decimals = 0,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | null;
  decimals?: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
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

function Comparison({ report }: { report: InsightsCycleReport }) {
  const rows = [
    { label: "Self rating", value: report.employee_average, bar: "bg-teal-500" },
    { label: "Manager rating", value: report.manager_average, bar: "bg-amber-500" },
    { label: "Final score", value: report.final_average, bar: "bg-[var(--wt-brand)]" },
  ];
  const gap = report.employee_average != null && report.manager_average != null ? report.manager_average - report.employee_average : null;
  return (
    <div className={CARD}>
      <h3 className="text-base font-semibold text-wt-text">How people see themselves vs how they are rated</h3>
      <p className="mt-0.5 text-xs text-wt-text-muted">Averages across everyone with a rating this cycle (out of 5).</p>
      <div className="mt-4 space-y-3.5">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="text-wt-text-muted">{r.label}</span>
              <span className="font-semibold tabular-nums text-wt-text">{r.value == null ? "—" : r.value.toFixed(2)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-wt-surface-3">
              <div className={cn("h-full rounded-full transition-[width] duration-700", r.bar)} style={{ width: `${((r.value ?? 0) / 5) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      {gap != null ? (
        <p className="mt-4 rounded-xl bg-wt-surface-2/70 px-3.5 py-2.5 text-xs text-wt-text-muted">
          Managers rate on average <span className="font-semibold text-wt-text">{Math.abs(gap).toFixed(2)}</span>{" "}
          {gap >= 0 ? "higher" : "lower"} than people rate themselves.
        </p>
      ) : null}
    </div>
  );
}

function Departments({ report }: { report: InsightsCycleReport }) {
  if (report.departments.length === 0) return null;
  return (
    <div className={CARD}>
      <h3 className="text-base font-semibold text-wt-text">By department</h3>
      <p className="mt-0.5 text-xs text-wt-text-muted">Average six-month result.</p>
      <ul className="mt-4 space-y-3">
        {report.departments.map((d) => (
          <li key={d.department}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-wt-text">
                {d.department} <span className="text-xs text-wt-text-faint">· {d.employees}</span>
              </span>
              <span className="font-semibold tabular-nums text-wt-text">{d.average == null ? "—" : d.average.toFixed(2)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-wt-surface-3">
              <div className="h-full rounded-full bg-[var(--wt-brand)]/70" style={{ width: `${((d.average ?? 0) / 5) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function fmt(value: number | null | undefined): string {
  return value == null ? "—" : value.toFixed(2);
}

function EmployeesTable({ report }: { report: InsightsCycleReport }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? report.employees.filter((e) => [e.name, e.emp_id, e.department].some((v) => String(v ?? "").toLowerCase().includes(q))) : report.employees;
  }, [report.employees, query]);

  const exportCsv = () =>
    downloadCsvFile(
      `pulse-${report.cycle_key.toLowerCase()}-results.csv`,
      ["Rank", "Employee", "Employee ID", "Department", "Months submitted", "Months finalised", "Self rating", "Manager rating", "Six-month result", "Percentile", "Promotion eligible"],
      report.employees.map((e: InsightsEmployee, i: number) => ({
        Rank: e.six_month_result == null ? "" : String(i + 1),
        Employee: e.name,
        "Employee ID": e.emp_id ?? "",
        Department: e.department ?? "",
        "Months submitted": String(e.months_submitted),
        "Months finalised": String(e.months_finalised),
        "Self rating": String(e.employee_average ?? ""),
        "Manager rating": String(e.manager_average ?? ""),
        "Six-month result": String(e.six_month_result ?? ""),
        Percentile: String(e.percentile ?? ""),
        "Promotion eligible": e.promotion_eligible ? "Yes" : "No",
      }))
    );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-wt-text">Six-month results</h3>
          <p className="mt-0.5 text-xs text-wt-text-muted">
            Each person&apos;s result is the average of their monthly final scores in {report.cycle_label}. Percentile is the share of people at or below them.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="w-full sm:w-64">
            <SearchInput id="pulse-insights-search" value={query} onChange={setQuery} placeholder="Search name, ID or department" aria-label="Search results" />
          </div>
          <Button type="button" variant="outline" onClick={exportCsv} disabled={report.employees.length === 0}>
            <Download className="mr-1.5 size-4" /> Export CSV
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-wt-border bg-wt-surface-1">
        <table className="w-full min-w-[44rem] text-sm">
          <thead>
            <tr className="border-b border-wt-border bg-wt-surface-2/60 text-left text-[11px] font-semibold uppercase tracking-wide text-wt-text-faint">
              <th className="px-4 py-2.5">#</th>
              <th className="px-4 py-2.5">Employee</th>
              <th className="px-4 py-2.5">Months</th>
              <th className="px-4 py-2.5 text-right">Self</th>
              <th className="px-4 py-2.5 text-right">Manager</th>
              <th className="px-4 py-2.5 text-right">Result</th>
              <th className="px-4 py-2.5 text-right">Percentile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wt-border">
            {rows.map((e: InsightsEmployee, i) => (
              <tr key={e.user_id} className="transition-colors hover:bg-wt-surface-2/50">
                <td className="px-4 py-3 tabular-nums text-wt-text-faint">{e.six_month_result == null ? "—" : report.employees.indexOf(e) + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-wt-text">{e.name}</p>
                  <p className="text-xs text-wt-text-muted">{[e.emp_id, e.department].filter(Boolean).join(" · ")}</p>
                </td>
                <td className="px-4 py-3 tabular-nums text-wt-text-muted">
                  {e.months_finalised}/{report.months.length}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-wt-text-muted">{fmt(e.employee_average)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-wt-text-muted">{fmt(e.manager_average)}</td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "inline-flex min-w-14 justify-center rounded-lg border px-2 py-1 font-bold tabular-nums",
                      e.promotion_eligible ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "border-wt-border bg-wt-surface-2 text-wt-text"
                    )}
                    title={e.promotion_eligible ? "Promotion eligible" : undefined}
                  >
                    {fmt(e.six_month_result)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-wt-text-muted">{e.percentile == null ? "—" : `${e.percentile}%`}</td>
                <td className="sr-only">{i}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-wt-text-muted">
                  No one matches that search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Pulse insights for HR/Admin: pick a six-month cycle to see how results are distributed (bell curve), how each person
 *  did over the cycle, and how ratings moved across the last 12 months. */
export function InsightsPanel() {
  const [cycleKey, setCycleKey] = useState("");
  const query = usePulseInsights(cycleKey);
  const data = query.data;

  const trend: TrendPoint[] = useMemo(
    () => (data?.year ?? []).map((m) => ({ month: m.month, employee: m.employee_average, manager: m.manager_average, final: m.final_average })),
    [data?.year]
  );

  if (query.isLoading) return <SectionLoading label="" />;
  if (query.isError || !data) {
    return <EmptyState title="Couldn't load the insights" description="Try again in a moment." />;
  }
  const report = data.cycle;
  const activeKey = cycleKey || data.cycle_key;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-wt-text">Insights</h3>
          <p className="mt-0.5 text-xs text-wt-text-muted">
            Six-month cycles run May–Oct and Nov–Apr. A person&apos;s result is the average of their monthly final scores.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <DropdownSelect
            value={activeKey}
            onChange={(v) => setCycleKey(v)}
            options={data.cycles.map((c) => ({ value: c.key, label: c.label }))}
            placeholder="Choose a cycle"
            aria-label="Review cycle"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Users} label="People with a result" value={report.employees_with_result} hint={`of ${report.employees_total} in this cycle`} />
        <Stat icon={Sigma} label="Average result" value={report.stats.mean} decimals={2} hint={report.stats.median != null ? `median ${report.stats.median.toFixed(2)}` : "no results yet"} />
        <Stat icon={Sigma} label="Spread (std. dev.)" value={report.stats.stdev} decimals={2} hint={report.stats.minimum != null && report.stats.maximum != null ? `from ${report.stats.minimum.toFixed(2)} to ${report.stats.maximum.toFixed(2)}` : "no results yet"} />
        <Stat icon={Award} label="Promotion eligible" value={report.promotion_eligible_count} hint={`result of ${report.promotion_min_score} or more`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className={CARD}>
          <h3 className="text-base font-semibold text-wt-text">Rating distribution</h3>
          <p className="mt-0.5 text-xs text-wt-text-muted">
            {report.cycle_label} · {report.employees_with_result} {report.employees_with_result === 1 ? "person" : "people"}
          </p>
          <div className="mt-4">
            {report.employees_with_result === 0 ? (
              <EmptyState title="No final scores yet" description="The distribution appears once reviews in this cycle are finalised." />
            ) : (
              <BellCurveChart report={report} />
            )}
          </div>
          {report.stats.count > 0 ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-wt-border pt-4 text-center sm:grid-cols-4">
              {[
                ["Bottom 10%", report.stats.p10],
                ["Lower quartile", report.stats.p25],
                ["Upper quartile", report.stats.p75],
                ["Top 10%", report.stats.p90],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-wt-text-faint">{label as string}</dt>
                  <dd className="mt-0.5 text-lg font-bold tabular-nums text-wt-text">{fmt(value as number | null)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        <div className="space-y-4">
          <Comparison report={report} />
          <Departments report={report} />
        </div>
      </div>

      <div className={CARD}>
        <h3 className="text-base font-semibold text-wt-text">The last 12 months</h3>
        <p className="mt-0.5 text-xs text-wt-text-muted">Average self rating, manager rating and final score of everyone, month by month.</p>
        <div className="mt-4">
          <TrendChart points={trend} />
        </div>
      </div>

      <EmployeesTable report={report} />
    </div>
  );
}
