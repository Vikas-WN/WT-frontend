"use client";

import { useMemo, useState } from "react";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { UtilizationCellDetail } from "@/components/dashboard/reports/utilization/UtilizationCellDetail";
import { UtilizationFilters } from "@/components/dashboard/reports/utilization/UtilizationFilters";
import { UtilizationGrid, type SelectedCell } from "@/components/dashboard/reports/utilization/UtilizationGrid";
import { UtilizationSummary } from "@/components/dashboard/reports/utilization/UtilizationSummary";
import { PageSectionHeader } from "@/components/dashboard/ui/PageSectionHeader";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { Button } from "@/components/ui/button";
import {
  UTILIZATION_COPY as COPY,
  UTILIZATION_DEFAULT_WEEKS,
  UTILIZATION_LEVEL_STYLE as STYLE,
  UTILIZATION_WEEKS_BEFORE_NOW,
  type UtilizationMetric,
} from "@/constants/utilizationHeatmap";
import { useWeeklyUtilization } from "@/hooks/reports/useWeeklyUtilization";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatApiDate, parseApiDate } from "@/utils/apiDate";
import { bandCounts, mondayOf, shortDay, startOfViewWeek } from "@/utils/utilizationDisplay";

const LEGEND: ReadonlyArray<{ level: "over" | "full" | "partial" | "bench"; text: string }> = [
  { level: "over", text: "Over 100%" },
  { level: "full", text: "80–100%" },
  { level: "partial", text: "40–80%" },
  { level: "bench", text: "Under 40%" },
];

/** HR / Admin: a week-by-week heatmap of planned and actual utilisation, by person and department. */
export function UtilizationHeatmapPageClient() {
  // UI state: the measure, filters, how far the window has been moved, and the cell whose details are open.
  const [metric, setMetric] = useState<UtilizationMetric>("planned");
  const [weeks, setWeeks] = useState<number>(UTILIZATION_DEFAULT_WEEKS);
  const [department, setDepartment] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [shift, setShift] = useState(0);
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const search = useDebouncedValue(searchInput, 350);

  const today = useMemo(() => new Date(), []);
  const start = formatApiDate(startOfViewWeek(today, UTILIZATION_WEEKS_BEFORE_NOW, shift));
  const query = useWeeklyUtilization({ start, weeks, department: department || undefined, search });
  const data = query.data;

  const focusIndex = useMemo(() => {
    if (!data) return 0;
    const now = mondayOf(today).getTime();
    const hit = data.weeks.findIndex((w) => parseApiDate(w)?.getTime() === now);
    return hit >= 0 ? hit : 0;
  }, [data, today]);
  const counts = useMemo(
    () => (data ? bandCounts(data.people.map((p) => p.weeks[focusIndex]?.planned_percent ?? 0), data.thresholds) : null),
    [data, focusIndex]
  );
  const focusDate = data ? parseApiDate(data.weeks[focusIndex]) : null;
  const picked = data && selected ? data.people.find((p) => p.email === selected.email) : undefined;

  return (
    <DashboardPageShell>
      <PageSectionHeader title={COPY.title} description={COPY.description} />
      <UtilizationFilters
        metric={metric}
        onMetric={setMetric}
        departments={data?.departments ?? []}
        department={department}
        onDepartment={setDepartment}
        search={searchInput}
        onSearch={setSearchInput}
        weeks={weeks}
        onWeeks={setWeeks}
        onShift={(delta) => setShift((s) => s + delta)}
        onReset={() => setShift(0)}
        shifted={shift !== 0}
      />
      {query.isError && !data ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-wt-border px-6 py-14 text-center">
          <p className="text-sm text-wt-text-muted">{COPY.loadError}</p>
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            {COPY.retry}
          </Button>
        </div>
      ) : !data ? (
        <SectionLoading label="" />
      ) : data.people.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-wt-border px-6 py-14 text-center text-sm text-wt-text-muted">{COPY.noData}</p>
      ) : (
        <>
          {counts && focusDate ? <UtilizationSummary counts={counts} weekLabel={shortDay(focusDate)} /> : null}
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-wt-text-muted" aria-label={COPY.legendTitle}>
            {LEGEND.map((l) => (
              <li key={l.level} className="flex items-center gap-1.5">
                <span className={`size-3 rounded ${STYLE[l.level].dot}`} aria-hidden />
                {l.text}
              </li>
            ))}
          </ul>
          <UtilizationGrid weeks={data.weeks} people={data.people} teams={data.teams} metric={metric} thresholds={data.thresholds} selected={selected} onSelect={setSelected} />
          {picked && selected ? <UtilizationCellDetail person={picked} index={selected.index} /> : null}
        </>
      )}
    </DashboardPageShell>
  );
}
