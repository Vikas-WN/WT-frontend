"use client";

import { cn } from "@/lib/utils";
import type { InsightsCycleReport } from "@/types/kpi";

const W = 640;
const H = 280;
const PAD = { left: 40, right: 16, top: 16, bottom: 36 };
const SCALE_MIN = 1;
const SCALE_MAX = 5;

const x = (value: number) => PAD.left + ((value - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * (W - PAD.left - PAD.right);

/**
 * How the six-month results are spread: a histogram of the real scores with the normal ("bell") curve of the same mean and
 * spread laid over it, so you can see how closely the organisation follows it. Dashed lines mark the average and the
 * promotion threshold.
 */
export function BellCurveChart({ report, className }: { report: InsightsCycleReport; className?: string }) {
  const { histogram, bell_curve: curve, stats, promotion_min_score: threshold } = report;
  const n = stats.count;
  if (n === 0) return null;

  const binWidth = histogram.length ? histogram[0].upper - histogram[0].lower : 0.5;
  // The normal curve as expected people per bin, so it shares the bars' scale.
  const curveCounts = curve.map((p) => ({ x: p.x, y: p.density * n * binWidth }));
  const yMax = Math.max(1, ...histogram.map((b) => b.count), ...curveCounts.map((p) => p.y));
  const tickStep = Math.max(1, Math.ceil(yMax / 5));
  const yTop = Math.ceil(yMax / tickStep) * tickStep;
  const y = (count: number) => H - PAD.bottom - (count / yTop) * (H - PAD.top - PAD.bottom);
  const ticks = Array.from({ length: yTop / tickStep + 1 }, (_, i) => i * tickStep);

  const path = curveCounts.map((p, i) => `${i ? "L" : "M"}${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ");
  const mean = stats.mean;

  return (
    <figure className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Distribution of ${n} six-month results`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="stroke-wt-border" strokeDasharray={t === 0 ? undefined : "3 4"} />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-wt-text-faint text-[10px]">
              {t}
            </text>
          </g>
        ))}
        {histogram.map((bin) => {
          const left = x(bin.lower) + 2;
          const width = Math.max(0, x(bin.upper) - x(bin.lower) - 4);
          const height = y(0) - y(bin.count);
          const aboveThreshold = bin.lower >= threshold;
          return (
            <g key={bin.lower}>
              <rect
                x={left}
                y={y(bin.count)}
                width={width}
                height={height}
                rx={4}
                className={cn(aboveThreshold ? "fill-emerald-500/70" : "fill-[var(--wt-brand)]/55", "transition-opacity hover:opacity-80")}
              >
                <title>{`${bin.lower.toFixed(1)}–${bin.upper.toFixed(1)}: ${bin.count} ${bin.count === 1 ? "person" : "people"}`}</title>
              </rect>
              {bin.count > 0 ? (
                <text x={left + width / 2} y={y(bin.count) - 5} textAnchor="middle" className="fill-wt-text text-[11px] font-semibold">
                  {bin.count}
                </text>
              ) : null}
            </g>
          );
        })}
        {path ? <path d={path} fill="none" strokeWidth={2.5} strokeLinecap="round" className="stroke-amber-500" /> : null}
        {mean != null ? (
          <g>
            <line x1={x(mean)} x2={x(mean)} y1={PAD.top} y2={y(0)} strokeDasharray="5 4" strokeWidth={1.5} className="stroke-wt-text" />
            <text
              x={Math.abs(mean - threshold) < 0.6 && mean < threshold ? x(mean) - 5 : x(mean) + 5}
              y={PAD.top + 10}
              textAnchor={Math.abs(mean - threshold) < 0.6 && mean < threshold ? "end" : "start"}
              className="fill-wt-text text-[10px] font-semibold"
            >
              Average {mean.toFixed(2)}
            </text>
          </g>
        ) : null}
        <g>
          <line x1={x(threshold)} x2={x(threshold)} y1={PAD.top} y2={y(0)} strokeDasharray="2 4" strokeWidth={1.5} className="stroke-emerald-600" />
          <text x={x(threshold) + 5} y={PAD.top + 24} className="fill-emerald-700 text-[10px] font-medium dark:fill-emerald-400">
            Promotion ≥ {threshold}
          </text>
        </g>
        {[1, 2, 3, 4, 5].map((v) => (
          <text key={v} x={x(v)} y={H - 14} textAnchor="middle" className="fill-wt-text-muted text-[11px]">
            {v}
          </text>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-wt-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[var(--wt-brand)]/55" aria-hidden /> People per score band
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-amber-500" aria-hidden /> Bell curve at the same average &amp; spread
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-emerald-500/70" aria-hidden /> At or above the promotion score
        </span>
      </figcaption>
    </figure>
  );
}
