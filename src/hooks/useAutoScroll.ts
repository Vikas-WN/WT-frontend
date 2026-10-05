"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Slowly scrolls a horizontal container to the right, pauses at the end, then loops to the start. It pauses while
 * the pointer or keyboard focus is inside, and does nothing for people who ask for reduced motion.
 */
export function useAutoScroll(
  ref: RefObject<HTMLElement | null>,
  { enabled, speedPxPerSecond, endPauseMs }: { enabled: boolean; speedPxPerSecond: number; endPauseMs: number }
) {
  const paused = useRef(false);

  // Side effect: a requestAnimationFrame loop drives scrollLeft; there is no React state to derive this from.
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pause = () => {
      paused.current = true;
    };
    const resume = () => {
      paused.current = false;
    };
    const events: Array<[string, () => void]> = [
      ["pointerenter", pause],
      ["pointerleave", resume],
      ["focusin", pause],
      ["focusout", resume],
      ["touchstart", pause],
      ["touchend", () => window.setTimeout(resume, 2500)],
    ];
    events.forEach(([name, handler]) => el.addEventListener(name, handler, { passive: true }));

    let position = el.scrollLeft;
    let last = performance.now();
    let holdUntil = 0;
    let frame = 0;

    const tick = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      const max = el.scrollWidth - el.clientWidth;
      if (max > 1 && !paused.current && now >= holdUntil && !document.hidden) {
        // If someone scrolled by hand, continue from where they left it.
        if (Math.abs(el.scrollLeft - position) > 2) position = el.scrollLeft;
        if (position >= max - 1) {
          holdUntil = now + endPauseMs;
          position = 0;
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          position = Math.min(max, position + (speedPxPerSecond * dt) / 1000);
          el.scrollLeft = position;
        }
      } else if (paused.current) {
        position = el.scrollLeft;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      events.forEach(([name, handler]) => el.removeEventListener(name, handler));
    };
  }, [ref, enabled, speedPxPerSecond, endPauseMs]);
}
