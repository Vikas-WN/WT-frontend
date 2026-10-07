import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** A circular progress ring with its value in the middle. `tone` picks the stroke; it eases from 0 on first paint. */
export function ScoreRing({
  percent,
  size = 64,
  stroke = 6,
  tone = "brand",
  children,
  className,
  label,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  tone?: "brand" | "success" | "warning";
  children?: ReactNode;
  className?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeClass =
    tone === "success" ? "stroke-emerald-500" : tone === "warning" ? "stroke-amber-500" : "stroke-[var(--wt-brand)]";
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-wt-surface-3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={cn(strokeClass, "transition-[stroke-dashoffset] duration-700 ease-[var(--wt-ease)] motion-reduce:transition-none")}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">{children}</div>
    </div>
  );
}
