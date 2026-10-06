"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** A horizontal bar whose fill grows from zero to `percent` on mount (and glides when the value changes). */
export function AnimatedBar({
  percent,
  className,
  fillClassName,
  delayMs = 0,
}: {
  percent: number;
  className?: string;
  fillClassName?: string;
  delayMs?: number;
}) {
  // UI state: flips true one frame after mount so the CSS transition has something to animate from.
  const [armed, setArmed] = useState(false);
  // Side effect: waiting a frame so the browser paints width 0 before the transition target is applied.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const width = armed ? Math.max(0, Math.min(100, percent)) : 0;
  return (
    <div className={cn("overflow-hidden rounded-full bg-wt-surface-3", className)} role="progressbar" aria-valuenow={Math.round(width)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={cn("h-full rounded-full bg-[var(--wt-brand)] transition-[width] duration-[900ms] ease-[var(--wt-ease)] motion-reduce:transition-none", fillClassName)}
        style={{ width: `${width}%`, transitionDelay: `${delayMs}ms` }}
      />
    </div>
  );
}
