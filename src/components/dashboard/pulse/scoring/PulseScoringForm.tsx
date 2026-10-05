"use client";

import { useState } from "react";

import { BonusFields } from "@/components/dashboard/pulse/scoring/BonusFields";
import { WeightSplit } from "@/components/dashboard/pulse/scoring/WeightSplit";
import { SCORING_FIELDS, maxScore, previewScore, round2, toForm, toPayload, type ScoringForm } from "@/components/dashboard/pulse/scoring/scoringMath";
import { InputField } from "@/components/dashboard/ui/forms";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { Button } from "@/components/ui/button";
import { usePulseScoring, useSaveScoring } from "@/hooks/pulse/usePulse";
import { notifyError } from "@/lib/notify";
import type { PulseScoreSettings } from "@/types/kpi";

/** How monthly ratings become a final score: the KPI / WebKnot-values split
 *  (default 90 / 10), the certification and recognition bonuses, and the
 *  promotion threshold. HR / Admin only. */
export function PulseScoringForm() {
  const scoring = usePulseScoring();
  if (scoring.isLoading) return <SectionLoading label="" />;
  if (scoring.isError || !scoring.data) return <p className="text-sm text-rose-600">Couldn&apos;t load the scoring settings.</p>;
  // Keyed on the saved values so the form re-seeds after a save / reset.
  return <ScoringEditor key={SCORING_FIELDS.map((f) => scoring.data[f]).join("|")} saved={scoring.data} />;
}

function ScoringEditor({ saved }: { saved: PulseScoreSettings }) {
  const [form, setForm] = useState<ScoringForm>(() => toForm(saved));
  const save = useSaveScoring();
  const payload = toPayload(form);
  const dirty = SCORING_FIELDS.some((f) => form[f] !== String(saved[f]));
  const weightsOk = payload ? Math.abs(payload.kpi_weight_percent + payload.values_weight_percent - 100) < 0.01 : false;

  const set = (field: keyof ScoringForm, value: string) => setForm((f) => ({ ...f, [field]: value }));
  // The two weights always split 100% — changing one fills in the other.
  const setWeight = (percent: number, source: "kpi" | "values") => {
    const n = Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0;
    setForm((f) => ({
      ...f,
      kpi_weight_percent: String(round2(source === "kpi" ? n : 100 - n)),
      values_weight_percent: String(round2(source === "kpi" ? 100 - n : n)),
    }));
  };

  const onSave = () => (payload ? save.mutate(payload) : notifyError("Fill in every field with a number."));

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-wt-text-faint">Overall weightage</h3>
        <WeightSplit kpi={form.kpi_weight_percent} values={form.values_weight_percent} onChange={setWeight} error={weightsOk ? undefined : "KPIs and values must add up to 100%."} />
        <p className="text-xs text-wt-text-muted">Per-KPI weightage is set on each KPI under Pulse → KPI Definitions.</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <BonusFields title="Certification bonus" kind="certification" form={form} onChange={set} />
        <BonusFields title="Recognition bonus" kind="recognition" form={form} onChange={set} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label="Promotion-eligible at score" type="number" value={form.promotion_min_score} onChange={(v) => set("promotion_min_score", v)} />
        {payload ? (
          <div className="rounded-xl border border-wt-border bg-wt-surface-2/50 p-3 text-xs text-wt-text-muted">
            Highest reachable score: <span className="font-semibold text-wt-text">{maxScore(payload)}</span>
            <br />
            Example (KPI 4.0, values 4.0, 2 certifications, 1 recognition):{" "}
            <span className="font-semibold text-wt-text">{previewScore(payload, 4, 4, 2, 1)}</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-wt-border pt-4">
        <p className="text-xs text-wt-text-faint">
          {saved.is_default ? "Using the default settings (90% KPIs / 10% values)." : `Last changed by ${saved.updated_by ?? "—"}${saved.updated_at ? ` on ${saved.updated_at}` : ""}.`}
          {" "}Applies to scores computed from now on — approved scores aren&apos;t recalculated.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" disabled={save.isPending || saved.is_default} onClick={() => save.mutate("reset")}>
            Reset to defaults
          </Button>
          <Button type="button" variant="brand" disabled={save.isPending || !dirty || !payload || !weightsOk} onClick={onSave}>
            {save.isPending ? "Saving…" : "Save scoring"}
          </Button>
        </div>
      </div>
    </div>
  );
}
