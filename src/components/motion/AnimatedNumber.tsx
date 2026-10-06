"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 700;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A number that counts up (or down) to its value when it first appears or changes. Whole numbers stay whole; people
 * who prefer reduced motion simply see the final value.
 */
export function AnimatedNumber({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  // UI state: the number currently on screen while it animates towards `value`.
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  // Side effect: a requestAnimationFrame loop drives the count; there is no render-time equivalent.
  useEffect(() => {
    if (!Number.isFinite(value)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / DURATION_MS);
      const next = start + (value - start) * easeOutCubic(progress);
      from.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className={`wt-num ${className ?? ""}`.trim()}>{shown.toFixed(decimals)}</span>;
}
