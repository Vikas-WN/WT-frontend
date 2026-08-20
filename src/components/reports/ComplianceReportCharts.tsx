"use client";

import { useMemo } from "react";
import { ReportBarChart } from "@/components/reports/charts/ReportBarChart";
import { ReportPieChart } from "@/components/reports/charts/ReportPieChart";
import { aggregateNumericByKey } from "@/utils/reports/reportChartData";

type Props = {
  rows: Array<Record<string, unknown>>;
};

function withoutTotalContractRows(rows: Array<Record<string, unknown>>) {
  return rows.filter((row) => {
    const label = String(row.employment_type ?? "").trim().toLowerCase();
    return label !== "total";
  });
}

export function ComplianceReportCharts({ rows }: Props) {
  const chartRows = useMemo(() => withoutTotalContractRows(rows), [rows]);

  const pieData = useMemo(
    () =>
      aggregateNumericByKey(chartRows, "employment_type", "count", { limit: 10 }),
    [chartRows]
  );

  const percentBars = useMemo(
    () =>
      chartRows
        .map((row) => ({
          name: String(row.employment_type ?? "—").trim() || "—",
          workforce_percent: Number(row.workforce_percent ?? 0) || 0,
        }))
        .filter((r) => r.workforce_percent > 0)
        .sort((a, b) => b.workforce_percent - a.workforce_percent),
    [chartRows]
  );

  if (!rows.length) return null;

  return (
    <div className="grid gap-4 min-w-0 lg:grid-cols-2">
      <ReportPieChart
        title="Contract Mix"
        description="Headcount by employment type"
        data={pieData}
        emptyLabel="No contract distribution to chart."
      />
      <ReportBarChart
        title="Workforce Share by Contract"
        description="Percent of workforce by employment type"
        data={percentBars}
        categoryKey="name"
        series={[
          {
            dataKey: "workforce_percent",
            name: "Workforce %",
            color: "#0d9488",
          },
        ]}
        valueSuffix="%"
        layout="vertical"
        emptyLabel="No workforce share to chart."
      />
    </div>
  );
}
