"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ReportChartCard } from "@/components/reports/charts/ReportChartCard";
import {
  REPORT_CHART_COLORS,
  REPORT_CHART_GRID,
  REPORT_CHART_MUTED,
  REPORT_CHART_TOOLTIP_BG,
  REPORT_CHART_TOOLTIP_BORDER,
  REPORT_CHART_TOOLTIP_TEXT,
} from "@/components/reports/charts/reportChartTheme";

export type ReportBarSeries = {
  dataKey: string;
  name: string;
  color?: string;
  stackId?: string;
};

type Props = {
  title: string;
  description?: string;
  data: Array<Record<string, string | number>>;
  categoryKey: string;
  series: ReportBarSeries[];
  emptyLabel?: string;
  layout?: "horizontal" | "vertical";
  height?: number;
  valueSuffix?: string;
};

export function ReportBarChart({
  title,
  description,
  data,
  categoryKey,
  series,
  emptyLabel = "No data to chart.",
  layout = "horizontal",
  height = 280,
  valueSuffix = "",
}: Props) {
  if (!data.length || !series.length) {
    return (
      <ReportChartCard title={title} description={description}>
        <p className="px-2 py-8 text-center text-sm text-wt-text-muted">{emptyLabel}</p>
      </ReportChartCard>
    );
  }

  const isVertical = layout === "vertical";

  return (
    <ReportChartCard title={title} description={description}>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={isVertical ? "vertical" : "horizontal"}
            margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
          >
            <CartesianGrid stroke={REPORT_CHART_GRID} strokeDasharray="3 3" vertical={!isVertical} />
            {isVertical ? (
              <>
                <XAxis
                  type="number"
                  tick={{ fill: REPORT_CHART_MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}${valueSuffix}`}
                />
                <YAxis
                  type="category"
                  dataKey={categoryKey}
                  width={110}
                  tick={{ fill: REPORT_CHART_MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={categoryKey}
                  tick={{ fill: REPORT_CHART_MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={data.length > 6 ? -28 : 0}
                  textAnchor={data.length > 6 ? "end" : "middle"}
                  height={data.length > 6 ? 64 : 32}
                />
                <YAxis
                  tick={{ fill: REPORT_CHART_MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={(v) => `${v}${valueSuffix}`}
                />
              </>
            )}
            <Tooltip
              cursor={{ fill: "color-mix(in srgb, var(--wt-brand) 8%, transparent)" }}
              contentStyle={{
                background: REPORT_CHART_TOOLTIP_BG,
                border: `1px solid ${REPORT_CHART_TOOLTIP_BORDER}`,
                borderRadius: 10,
                color: REPORT_CHART_TOOLTIP_TEXT,
                fontSize: 12,
              }}
              formatter={(value: number | string, name: string) => [
                `${value}${valueSuffix}`,
                name,
              ]}
            />
            {series.length > 1 ? (
              <Legend
                wrapperStyle={{ fontSize: 12, color: REPORT_CHART_MUTED }}
              />
            ) : null}
            {series.map((s, idx) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.color ?? REPORT_CHART_COLORS[idx % REPORT_CHART_COLORS.length]}
                stackId={s.stackId}
                radius={s.stackId ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                maxBarSize={48}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ReportChartCard>
  );
}
