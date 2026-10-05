"use client";

import { InputField } from "@/components/dashboard/ui/forms";
import type { ScoringForm } from "@/components/dashboard/pulse/scoring/scoringMath";

type BonusKey = "certification" | "recognition";

/** A bonus is a percentage of the weighted KPI score, added on top — a lower
 *  rate up to a count, a higher one beyond it. */
export function BonusFields({
  title,
  kind,
  form,
  onChange,
}: {
  title: string;
  kind: BonusKey;
  form: ScoringForm;
  onChange: (field: keyof ScoringForm, value: string) => void;
}) {
  return (
    <section className="rounded-xl border border-wt-border bg-wt-surface-2/40 p-4">
      <h4 className="text-sm font-semibold text-wt-text">{title}</h4>
      <p className="mb-3 mt-0.5 text-xs text-wt-text-muted">Lower rate up to the count, higher rate above it.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <InputField label="Lower rate (%)" type="number" value={form[`${kind}_low_rate_percent`]} onChange={(v) => onChange(`${kind}_low_rate_percent`, v)} />
        <InputField label="Lower rate up to (count)" type="number" value={form[`${kind}_low_max`]} onChange={(v) => onChange(`${kind}_low_max`, v)} />
        <InputField label="Higher rate (%)" type="number" value={form[`${kind}_high_rate_percent`]} onChange={(v) => onChange(`${kind}_high_rate_percent`, v)} />
      </div>
    </section>
  );
}
