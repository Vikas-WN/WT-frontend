"use client";

import { useMemo } from "react";
import { ReportBarChart } from "@/components/reports/charts/ReportBarChart";
import { ReportPieChart } from "@/components/reports/charts/ReportPieChart";
import { countByKey, countSkillTokens } from "@/utils/reports/reportChartData";

type Props = {
  rows: Array<Record<string, unknown>>;
};

export function SkillReportCharts({ rows }: Props) {
  const byDepartment = useMemo(
    () =>
      countByKey(rows, "department", { limit: 8 }).map((d) => ({
        name: d.name,
        people: d.value,
      })),
    [rows]
  );

  const primarySkills = useMemo(
    () =>
      countSkillTokens(rows, "primary_skills", { limit: 10 }).map((d) => ({
        name: d.name,
        people: d.value,
      })),
    [rows]
  );

  const roleMix = useMemo(() => countByKey(rows, "role", { limit: 8 }), [rows]);

  if (!rows.length) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ReportBarChart
        title="Skill Inventory by Department"
        description="People represented in the loaded inventory by department"
        data={byDepartment}
        categoryKey="name"
        series={[{ dataKey: "people", name: "People" }]}
        layout="vertical"
        emptyLabel="No department skill rows to chart."
      />
      <ReportPieChart
        title="Role Mix in Inventory"
        description="Distribution of roles in the skill inventory page"
        data={roleMix}
        emptyLabel="No role mix to chart."
      />
      <ReportBarChart
        title="Top Primary Skills"
        description="Most frequent primary skills in the loaded inventory"
        data={primarySkills}
        categoryKey="name"
        series={[{ dataKey: "people", name: "People", color: "#0d9488" }]}
        layout="vertical"
        emptyLabel="No primary skills to chart."
        height={320}
      />
    </div>
  );
}
