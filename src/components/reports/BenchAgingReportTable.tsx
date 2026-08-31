"use client";

import { useMemo } from "react";
import { MetricCard } from "@/components/dashboard/ui/MetricCard";
import { DataTable } from "@/components/dashboard/ui/DataTable";
import { ReportBarChart } from "@/components/reports/charts/ReportBarChart";
import { ReportPieChart } from "@/components/reports/charts/ReportPieChart";
import {
  benchDaysBuckets,
} from "@/utils/reports/reportChartData";

type Props = {
  rows: Array<Record<string, unknown>>;
  peopleOnBench: number;
  loading?: boolean;
};

export function BenchAgingReportTable({ rows, peopleOnBench, loading = false }: Props) {
  const agingBuckets = useMemo(() => benchDaysBuckets(rows), [rows]);

  /** Department chart counts people (not days) — bench_days may be non-numeric for investment. */
  const departmentHeadcount = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const dept = String(row.department ?? "—").trim() || "—";
      map.set(dept, (map.get(dept) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, people: value }))
      .sort((a, b) => b.people - a.people)
      .slice(0, 8);
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-xl">
        <MetricCard label="People on bench" value={peopleOnBench} loading={loading} />
      </div>

      {!loading && rows.length > 0 ? (
        <div className="grid gap-4 min-w-0 lg:grid-cols-2">
          <ReportPieChart
            title="Bench Aging Buckets"
            description="People grouped by days on bench"
            data={agingBuckets}
            emptyLabel="No aging distribution available."
          />
          <ReportBarChart
            title="Bench by Department"
            description="Headcount currently on bench per department"
            data={departmentHeadcount}
            categoryKey="name"
            series={[{ dataKey: "people", name: "People" }]}
            layout="vertical"
            emptyLabel="No department breakdown available."
          />
        </div>
      ) : null}

      <DataTable
        title="Bench aging and size (includes investment allocations)"
        columns={["emp_id", "name", "department", "bench_days"]}
        rows={rows}
        emptyLabel="No bench aging rows."
        compact
      />
    </div>
  );
}
