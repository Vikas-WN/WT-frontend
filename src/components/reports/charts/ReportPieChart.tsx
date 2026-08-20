"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ReportChartCard } from "@/components/reports/charts/ReportChartCard";
import {
  REPORT_CHART_COLORS,
  REPORT_CHART_MUTED,
  REPORT_CHART_TOOLTIP_BG,
  REPORT_CHART_TOOLTIP_BORDER,
  REPORT_CHART_TOOLTIP_TEXT,
} from "@/components/reports/charts/reportChartTheme";

export type ReportPieSlice = {
  name: string;
  value: number;
};

type Props = {
  title: string;
  description?: string;
  data: ReportPieSlice[];
  emptyLabel?: string;
  height?: number;
  valueSuffix?: string;
};

export function ReportPieChart({
  title,
  description,
  data,
  emptyLabel = "No data to chart.",
  height = 280,
  valueSuffix = "",
}: Props) {
  const slices = data.filter((d) => Number.isFinite(d.value) && d.value > 0);
  if (!slices.length) {
    return (
      <ReportChartCard title={title} description={description}>
        <p className="px-2 py-8 text-center text-sm text-wt-text-muted">{emptyLabel}</p>
      </ReportChartCard>
    );
  }

  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <ReportChartCard title={title} description={description} className="min-w-0">
      <div
        className="w-full min-w-0 h-[220px] sm:h-[260px] lg:h-[280px]"
        style={height !== 280 ? { height } : undefined}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="46%"
              innerRadius={48}
              outerRadius={78}
              paddingAngle={2}
              stroke="var(--wt-surface-1)"
              strokeWidth={2}
            >
              {slices.map((_, idx) => (
                <Cell
                  key={`slice-${idx}`}
                  fill={REPORT_CHART_COLORS[idx % REPORT_CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: REPORT_CHART_TOOLTIP_BG,
                border: `1px solid ${REPORT_CHART_TOOLTIP_BORDER}`,
                borderRadius: 10,
                color: REPORT_CHART_TOOLTIP_TEXT,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => {
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                return [`${value}${valueSuffix} (${pct}%)`, name];
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: 12, color: REPORT_CHART_MUTED }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ReportChartCard>
  );
}
