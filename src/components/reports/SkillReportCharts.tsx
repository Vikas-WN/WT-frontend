"use client";

import { useMemo } from "react";
import { ReportBarChart } from "@/components/reports/charts/ReportBarChart";
import { ReportPieChart } from "@/components/reports/charts/ReportPieChart";
import { countByKey } from "@/utils/reports/reportChartData";

type Props = {
  rows: Array<Record<string, unknown>>;
};

function skillTokenCount(rows: Array<Record<string, unknown>>, key: string) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const raw = row[key];
    const tokens = Array.isArray(raw)
      ? raw.map(String)
      : String(raw ?? "")
          .split(/[,|;/]/)
          .map((part) => part.trim())
          .filter(Boolean);
    for (const token of tokens) {
      map.set(token, (map.get(token) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, people: value }))
    .sort((a, b) => b.people - a.people)
    .slice(0, 10);
}

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
    () => skillTokenCount(rows, "primary_skills"),
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
