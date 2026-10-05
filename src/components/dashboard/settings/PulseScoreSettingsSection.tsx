"use client";

import { Gauge } from "lucide-react";

import { PulseScoringForm } from "@/components/dashboard/pulse/scoring/PulseScoringForm";

/** Settings → Pulse scoring (HR / Admin). The same editor lives in Pulse →
 *  Scoring; both read and write one set of settings. */
export function PulseScoreSettingsSection() {
  return (
    <section className="rounded-3xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm dark:bg-wt-surface-2 dark:shadow-none sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <Gauge className="size-4 text-[var(--wt-brand)]" />
        <h2 className="text-sm font-semibold text-wt-text">Pulse scoring</h2>
        <span className="ml-auto text-[11px] text-wt-text-faint">HR / Admin</span>
      </div>
      <p className="mb-5 text-xs text-wt-text-muted">How monthly review ratings become a final score.</p>
      <PulseScoringForm />
    </section>
  );
}
