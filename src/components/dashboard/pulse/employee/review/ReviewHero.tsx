"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { ScoreRing } from "@/components/dashboard/pulse/shared/ScoreRing";
import type { SaveState } from "@/components/dashboard/pulse/employee/review/useReviewForm";
import { cn } from "@/lib/utils";
import { formatMonthLabel } from "@/utils/pulseMonth";

const SAVE_COPY: Record<SaveState, { label: string; tone: string }> = {
  saved: { label: "All changes saved", tone: "text-emerald-700 dark:text-emerald-400" },
  saving: { label: "Saving…", tone: "text-wt-text-muted" },
  error: { label: "Couldn't save — we'll retry on your next edit", tone: "text-rose-600 dark:text-rose-400" },
};

function SaveIndicator({ state }: { state: SaveState }) {
  const copy = SAVE_COPY[state];
  const Icon = state === "saving" ? Loader2 : state === "error" ? AlertCircle : CheckCircle2;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", copy.tone)} role="status" aria-live="polite">
      <Icon className={cn("size-3.5", state === "saving" && "animate-spin")} aria-hidden />
      {copy.label}
    </span>
  );
}

/** The top of the review: which month, how far along, and what is still missing — with the autosave state beside it. */
export function ReviewHero({
  month,
  done,
  total,
  missing,
  saveState,
}: {
  month: string;
  done: number;
  total: number;
  missing: readonly string[];
  saveState: SaveState;
}) {
  const pct = total === 0 ? 100 : Math.round((done / total) * 100);
  const complete = pct === 100 && missing.length === 0;
  return (
    <section className="relative overflow-hidden rounded-3xl border border-wt-border bg-wt-surface-1 p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_120%_at_0%_0%,color-mix(in_srgb,var(--wt-brand)_9%,transparent),transparent_60%)]"
      />
      <div className="relative flex flex-wrap items-center gap-5">
        <ScoreRing percent={pct} size={76} stroke={7} tone={complete ? "success" : "brand"} label="Review completion">
          <span className="text-lg font-bold tabular-nums text-wt-text">{pct}%</span>
        </ScoreRing>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wt-brand)]">Self review</p>
          <h2 className="mt-0.5 text-xl font-bold tracking-[-0.02em] text-wt-text sm:text-2xl">{formatMonthLabel(month)}</h2>
          <p className="mt-1 text-sm text-wt-text-muted">
            {complete
              ? "Everything's in. Head to Submit when you're ready."
              : missing.length > 0
                ? `${missing.length} ${missing.length === 1 ? "thing" : "things"} left. Next up: ${missing[0]}`
                : "Work through the steps — your answers save as you go."}
          </p>
        </div>
        <SaveIndicator state={saveState} />
      </div>
    </section>
  );
}
