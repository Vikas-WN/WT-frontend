"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { Knot } from "@/components/mascot/Knot";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Button } from "@/components/ui/button";
import { fireConfetti } from "@/lib/confetti";
import { milestoneBursts, milestoneTitle } from "@/utils/milestones";

const BURST_GAP_MS = 650;

/**
 * The big moment for a work-anniversary milestone (1, 2, 3, 5, 10 … years): the mascot throws a party, the number counts up and
 * the confetti comes in several bursts — more of them the bigger the milestone. Shown once, on the day; a click anywhere
 * closes it. Quieter anniversaries keep the regular banner and a single burst.
 */
export function MilestoneCelebration({ name, years, onClose }: { name: string; years: number; onClose: () => void }) {
  // Side effect: timed confetti bursts belong to the moment the dialog appears.
  useEffect(() => {
    const timers: number[] = [];
    for (let i = 0; i < milestoneBursts(years); i += 1) {
      timers.push(
        window.setTimeout(() => fireConfetti({ originYRatio: 0.2 + (i % 2) * 0.12, particleCount: 200 }), i * BURST_GAP_MS)
      );
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [years]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;
  const first = name.trim().split(/\s+/)[0] || "there";
  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={milestoneTitle(years)}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-wt-border bg-wt-surface-1 p-8 text-center shadow-[var(--wt-shadow-lg)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,color-mix(in_srgb,var(--wt-brand)_14%,transparent),transparent_70%)]"
        />
        <div className="relative">
          <Knot mood="party" size={104} className="mx-auto" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--wt-brand)]">Congratulations, {first}!</p>
          <p className="mt-2 text-6xl font-bold tabular-nums tracking-tight text-wt-text">
            <AnimatedNumber value={years} />
          </p>
          <h2 className="mt-1 text-lg font-semibold text-wt-text">{milestoneTitle(years)}</h2>
          <p className="mt-2 text-sm leading-relaxed text-wt-text-muted">
            Thank you for everything you have built and everyone you have helped along the way. Here is to the next chapter.
          </p>
          <Button type="button" variant="brand" className="mt-6" onClick={onClose}>
            Thank you!
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
