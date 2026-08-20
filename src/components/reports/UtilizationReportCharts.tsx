"use client";

import { useMemo } from "react";
import { ReportBarChart } from "@/components/reports/charts/ReportBarChart";
import { rowsToBarSeries } from "@/utils/reports/reportChartData";

type Props = {
  rows: Array<Record<string, unknown>>;
};

export function UtilizationReportCharts({ rows }: Props) {
  const utilizationBars = useMemo(
    () =>
      rowsToBarSeries(
        rows,
        "department",
        [{ key: "utilization_percent", name: "Utilization %" }],
        { limit: 12 }
      ),
    [rows]
  );

  const capacityStack = useMemo(
    () =>
      rowsToBarSeries(
        rows,
        "department",
        [
          { key: "actual_billed", name: "Billed" },
          { key: "buffer", name: "Buffer" },
          { key: "investment", name: "Investment" },
          { key: "talent_pool", name: "Talent Pool" },
        ],
        { limit: 10 }
      ),
    [rows]
  );

  if (!rows.length) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ReportBarChart
        title="Utilization by Department"
        description="Utilization percent across departments"
        data={utilizationBars}
        categoryKey="name"
        series={[{ dataKey: "utilization_percent", name: "Utilization %" }]}
        valueSuffix="%"
        layout="vertical"
        emptyLabel="No utilization rows to chart."
      />
      <ReportBarChart
        title="Capacity Mix by Department"
        description="Billed, buffer, investment, and talent pool headcount"
        data={capacityStack}
        categoryKey="name"
        series={[
          { dataKey: "actual_billed", name: "Billed", stackId: "cap" },
          { dataKey: "buffer", name: "Buffer", stackId: "cap", color: "#6366f1" },
          {
            dataKey: "investment",
            name: "Investment",
            stackId: "cap",
            color: "#d97706",
          },
          {
            dataKey: "talent_pool",
            name: "Talent Pool",
            stackId: "cap",
            color: "#e11d48",
          },
        ]}
        emptyLabel="No capacity rows to chart."
      />
    </div>
  );
}
