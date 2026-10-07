"use client";

import { cn } from "@/lib/utils";
import { formatMonthLabel } from "@/utils/pulseMonth";

export interface TrendPoint {
  month: string;
  employee: number | null;
  manager: number | null;
  final: number | null;
}

const W = 720;
const H = 260;
const PAD = { left: 36, right: 14, top: 14, bottom: 34 };
const MIN = 1;
const MAX = 5;

const SERIES = [
  { key: "employee", label: "Self rating", stroke: "stroke-teal-500", fill: "fill-teal-500", dash: "5 4" },
  { key: "manager", label: "Manager rating", stroke: "stroke-amber-500", fill: "fill-amber-500", dash: "2 4" },
  { key: "final", label: "Final score", stroke: "stroke-[var(--wt-brand)]", fill: "fill-[var(--wt-brand)]", dash: undefined },
] as const;

/** Self rating, manager rating and final score, month after month (a year at a glance). A line breaks where a month has
 *  no value, instead of pretending it was zero. */
export function TrendChart({ points, className }: { points: readonly TrendPoint[]; className?: string }) {
  if (points.length === 0) return null;
  const x = (i: number) => PAD.left + (points.length === 1 ? (W - PAD.left - PAD.right) / 2 : (i / (points.length - 1)) * (W - PAD.left - PAD.right));
  const y = (value: number) => PAD.top + (1 - (value - MIN) / (MAX - MIN)) * (H - PAD.top - PAD.bottom);
  const anyData = points.some((p) => p.employee != null || p.manager != null || p.final != null);

  const segments = (key: (typeof SERIES)[number]["key"]) => {
    const out: string[] = [];
    let current = "";
    points.forEach((p, i) => {
      const v = p[key];
      if (v == null) {
        if (current) out.push(current);
        current = "";
        return;
      }
      current += `${current ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
    });
    if (current) out.push(current);
    return out;
  };

  return (
    <figure className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Ratings by month">
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} className="stroke-wt-border" strokeDasharray={v === 1 ? undefined : "3 4"} />
            <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" className="fill-wt-text-faint text-[10px]">
              {v}
            </text>
          </g>
        ))}
        {points.map((p, i) => (
          <text key={p.month} x={x(i)} y={H - 12} textAnchor="middle" className="fill-wt-text-muted text-[10px]">
            {formatMonthLabel(p.month, "short").split(" ")[0]}
          </text>
        ))}
        {SERIES.map((s) =>
          segments(s.key).map((d, i) => (
            <path key={`${s.key}-${i}`} d={d} fill="none" strokeWidth={s.key === "final" ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.dash} className={s.stroke} />
          ))
        )}
        {SERIES.map((s) =>
          points.map((p, i) =>
            p[s.key] == null ? null : (
              <circle key={`${s.key}-${p.month}`} cx={x(i)} cy={y(p[s.key] as number)} r={s.key === "final" ? 4 : 3} className={cn(s.fill, "stroke-wt-surface-1")} strokeWidth={1.5}>
                <title>{`${formatMonthLabel(p.month)} · ${s.label}: ${(p[s.key] as number).toFixed(2)}`}</title>
              </circle>
            )
          )
        )}
        {!anyData ? (
          <text x={W / 2} y={H / 2} textAnchor="middle" className="fill-wt-text-faint text-xs">
            No reviewed months in this period yet
          </text>
        ) : null}
      </svg>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-wt-text-muted">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <svg width="22" height="8" aria-hidden>
              <line x1="1" x2="21" y1="4" y2="4" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={s.dash} className={s.stroke} />
            </svg>
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
