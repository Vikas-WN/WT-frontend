"use client";

import { useMemo } from "react";
import { ReportPieChart } from "@/components/reports/charts/ReportPieChart";
import { ReportBarChart } from "@/components/reports/charts/ReportBarChart";
import { countByKey } from "@/utils/reports/reportChartData";

type Props = {
  rows: Array<Record<string, unknown>>;
};

export function BgvReportCharts({ rows }: Props) {
  const overallStatus = useMemo(
    () => countByKey(rows, "overall_status", { limit: 8 }),
    [rows]
  );

  const employmentStatus = useMemo(
    () =>
      countByKey(rows, "employment", { limit: 8 }).map((d) => ({
        name: d.name,
        count: d.value,
      })),
    [rows]
  );

  if (!rows.length) return null;

  return (
    <div className="grid gap-4 min-w-0 lg:grid-cols-2">
      <ReportPieChart
        title="BGV Overall Status"
        description="Cases by overall verification status (current filters)"
        data={overallStatus}
        emptyLabel="No BGV status rows to chart."
      />
      <ReportBarChart
        title="Employment Verification Status"
        description="Cases by employment check status"
        data={employmentStatus}
        categoryKey="name"
        series={[{ dataKey: "count", name: "Cases", color: "#6366f1" }]}
        layout="vertical"
        emptyLabel="No employment status rows to chart."
      />
    </div>
  );
}
