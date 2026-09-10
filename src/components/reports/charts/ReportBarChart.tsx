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
    <ReportChartCard title={title} description={description} className="min-w-0">
      <div
        className="w-full min-w-0 h-[220px] sm:h-[260px] lg:h-[280px]"
        style={height !== 280 ? { height } : undefined}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={isVertical ? "vertical" : "horizontal"}
            margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
          >
            <CartesianGrid stroke={REPORT_CHART_GRID} strokeDasharray="3 3" vertical={!isVertical} />
            {/* XAxis / YAxis must be *direct* children of BarChart — recharts
                collects them by walking props.children, and wrapping them in a
                fragment inside a ternary makes it silently drop the axes (the
                chart then renders with no ticks and every bar stacked at the
                same coordinate). Swap props by orientation instead. */}
            <XAxis
              {...(isVertical
                ? {
                    type: "number" as const,
                    tickFormatter: (v: number | string) => `${v}${valueSuffix}`,
                  }
                : {
                    dataKey: categoryKey,
                    interval: 0 as const,
                    angle: data.length > 6 ? -28 : 0,
                    textAnchor: data.length > 6 ? ("end" as const) : ("middle" as const),
                    height: data.length > 6 ? 64 : 32,
                  })}
              tick={{ fill: REPORT_CHART_MUTED, fontSize: isVertical ? 11 : 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              {...(isVertical
                ? {
                    type: "category" as const,
                    dataKey: categoryKey,
                    width: 96,
                  }
                : {
                    width: 40,
                    tickFormatter: (v: number | string) => `${v}${valueSuffix}`,
                  })}
              tick={{ fill: REPORT_CHART_MUTED, fontSize: isVertical ? 10 : 11 }}
              axisLine={false}
              tickLine={false}
            />
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
