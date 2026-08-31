"use client";

import { useMemo } from "react";
import { ReportBarChart } from "@/components/reports/charts/ReportBarChart";
import { ReportPieChart } from "@/components/reports/charts/ReportPieChart";
import {
  aggregateNumericByKey,
  experienceBandBuckets,
  rowsToBarSeries,
} from "@/utils/reports/reportChartData";

type Props = {
  headcountRows: Array<Record<string, unknown>>;
  roleBillingRows: Array<Record<string, unknown>>;
  experienceRows: Array<Record<string, unknown>>;
};

export function WorkforceReportCharts({
  headcountRows,
  roleBillingRows,
  experienceRows,
}: Props) {
  const headcountByDept = useMemo(
    () =>
      aggregateNumericByKey(headcountRows, "department", "total_headcount", {
        limit: 8,
      }).map((d) => ({ name: d.name, headcount: d.value })),
    [headcountRows]
  );

  const billingMix = useMemo(() => {
    let billed = 0;
    let unbilled = 0;
    for (const row of roleBillingRows) {
      billed += Number(row.billed_count ?? 0) || 0;
      unbilled += Number(row.unbilled_count ?? 0) || 0;
    }
    return [
      { name: "Billed", value: billed },
      { name: "Unbilled", value: unbilled },
    ].filter((s) => s.value > 0);
  }, [roleBillingRows]);

  const roleBillingBars = useMemo(
    () =>
      rowsToBarSeries(
        roleBillingRows,
        "role",
        [
          { key: "billed_count", name: "Billed" },
          { key: "unbilled_count", name: "Unbilled" },
        ],
        { limit: 8 }
      ),
    [roleBillingRows]
  );

  const experienceBands = useMemo(
    () =>
      experienceBandBuckets(experienceRows, "total_experience").map((d) => ({
        name: d.name,
        people: d.value,
      })),
    [experienceRows]
  );

  if (!headcountRows.length && !roleBillingRows.length && !experienceRows.length) {
    return null;
  }

  return (
    <div className="grid gap-4 min-w-0 lg:grid-cols-2">
      <ReportBarChart
        title="Headcount by Department"
        description="Total headcount aggregated from the distribution table"
        data={headcountByDept}
        categoryKey="name"
        series={[{ dataKey: "headcount", name: "Headcount" }]}
        layout="vertical"
        emptyLabel="No headcount rows to chart."
      />
      <ReportPieChart
        title="Billed vs Unbilled Mix"
        description="Workforce billing status across roles"
        data={billingMix}
        emptyLabel="No billing mix to chart."
      />
      <ReportBarChart
        title="Role Billing Split"
        description="Billed and unbilled counts by role"
        data={roleBillingBars}
        categoryKey="name"
        series={[
          { dataKey: "billed_count", name: "Billed", stackId: "billing" },
          {
            dataKey: "unbilled_count",
            name: "Unbilled",
            stackId: "billing",
            color: "#d97706",
          },
        ]}
        emptyLabel="No role billing rows to chart."
      />
      <ReportBarChart
        title="Experience Distribution"
        description="People by total experience band (loaded page)"
        data={experienceBands}
        categoryKey="name"
        series={[{ dataKey: "people", name: "People", color: "#0d9488" }]}
        emptyLabel="No experience rows to chart."
      />
    </div>
  );
}
