"use client";

import { useEffect, useMemo, useState } from "react";
import { Gauge } from "lucide-react";

import { InputField } from "@/components/dashboard/ui/forms";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/api/error";
import { hrmsService } from "@/services/hrms.service";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import type { PulseScoreSettings, PulseScoreSettingsWrite } from "@/types/kpi";

type FormState = Record<keyof PulseScoreSettingsWrite, string>;

const FIELDS: (keyof PulseScoreSettingsWrite)[] = [
  "kpi_weight_percent",
  "values_weight_percent",
  "certification_low_rate_percent",
  "certification_high_rate_percent",
  "certification_low_max",
  "recognition_low_rate_percent",
  "recognition_high_rate_percent",
  "recognition_low_max",
  "promotion_min_score",
];

function toForm(s: PulseScoreSettingsWrite): FormState {
  return Object.fromEntries(FIELDS.map((f) => [f, String(s[f])])) as FormState;
}

function toPayload(form: FormState): PulseScoreSettingsWrite | null {
  const out = {} as PulseScoreSettingsWrite;
  for (const f of FIELDS) {
    const n = Number(form[f]);
    if (form[f].trim() === "" || !Number.isFinite(n)) return null;
    out[f] = n;
  }
  return out;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp15 = (n: number) => Math.round(Math.min(5, Math.max(1, n)) * 10) / 10;

/** Mirrors app/domain/kpi_score.py so HR sees the effect before saving. */
function previewScore(s: PulseScoreSettingsWrite, kpi: number, values: number, certs: number, recs: number) {
  const x = (s.kpi_weight_percent / 100) * clamp15(kpi);
  const y = (s.values_weight_percent / 100) * clamp15(values);
  const bonus = (count: number, low: number, high: number, lowMax: number) =>
    count <= 0 ? 0 : x * ((count <= lowMax ? low : high) / 100);
  return round2(
    x +
      y +
      bonus(certs, s.certification_low_rate_percent, s.certification_high_rate_percent, s.certification_low_max) +
      bonus(recs, s.recognition_low_rate_percent, s.recognition_high_rate_percent, s.recognition_low_max)
  );
}

function maxScore(s: PulseScoreSettingsWrite) {
  const topKpi = (s.kpi_weight_percent / 100) * 5;
  return round2(
    topKpi +
      (s.values_weight_percent / 100) * 5 +
      topKpi * ((s.certification_high_rate_percent + s.recognition_high_rate_percent) / 100)
  );
}

/** HR/Admin only: how Pulse turns ratings into a final score. */
export function PulseScoreSettingsSection() {
  const [saved, setSaved] = useState<PulseScoreSettings | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState<"save" | "reset" | null>(null);

  useEffect(() => {
    let alive = true;
    hrmsService
      .getPulseScoreSettings()
      .then((s) => {
        if (!alive) return;
        setSaved(s);
        setForm(toForm(s));
      })
      .catch(() => alive && setLoadError(true));
    return () => {
      alive = false;
    };
  }, []);

  const payload = useMemo(() => (form ? toPayload(form) : null), [form]);
  const dirty = Boolean(saved && form && FIELDS.some((f) => form[f] !== String(saved[f])));
  const weightsOk = payload ? Math.abs(payload.kpi_weight_percent + payload.values_weight_percent - 100) < 0.01 : false;

  const set = (field: keyof PulseScoreSettingsWrite, value: string) => {
    setForm((f) => {
      if (!f) return f;
      const next = { ...f, [field]: value };
      // The two weights always split 100% — editing one fills in the other.
      const n = Number(value);
      if (value.trim() !== "" && Number.isFinite(n)) {
        if (field === "kpi_weight_percent") next.values_weight_percent = String(round2(100 - n));
        if (field === "values_weight_percent") next.kpi_weight_percent = String(round2(100 - n));
      }
      return next;
    });
  };

  const run = async (kind: "save" | "reset") => {
    if (kind === "save" && !payload) {
      notifyError("Fill in every field with a number.");
      return;
    }
    setBusy(kind);
    try {
      const next =
        kind === "save"
          ? await hrmsService.updatePulseScoreSettings(payload as PulseScoreSettingsWrite)
          : await hrmsService.resetPulseScoreSettings();
      setSaved(next);
      setForm(toForm(next));
      notifySuccess(kind === "save" ? "Pulse score settings saved." : "Pulse score settings reset to defaults.");
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't save the score settings."
        )
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-3xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm dark:bg-wt-surface-2 dark:shadow-none sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <Gauge className="size-4 text-[var(--wt-brand)]" />
        <h2 className="text-sm font-semibold text-wt-text">Pulse scoring</h2>
        <span className="ml-auto text-[11px] text-wt-text-faint">HR / Admin</span>
      </div>
      <p className="mb-4 text-xs text-wt-text-muted">
        How monthly review ratings become a final score. Changes apply to scores computed from now on —
        already-approved scores are not recalculated. Per-KPI weightage is set on each KPI in Pulse → KPI
        Definitions.
      </p>

      {loadError ? (
        <p className="text-sm text-rose-600">Couldn&apos;t load the score settings.</p>
      ) : !form || !saved ? (
        <p className="text-sm text-wt-text-muted">Loading…</p>
      ) : (
        <div className="space-y-5">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-wt-text-faint">Weights</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <InputField
                label="KPIs (%)"
                type="number"
                value={form.kpi_weight_percent}
                onChange={(v) => set("kpi_weight_percent", v)}
              />
              <InputField
                label="WebKnot values (%)"
                type="number"
                value={form.values_weight_percent}
                onChange={(v) => set("values_weight_percent", v)}
                error={weightsOk ? undefined : "KPIs and values must add up to 100%."}
              />
            </div>
          </div>

          {(
            [
              ["Certification bonus", "certification"],
              ["Recognition bonus", "recognition"],
            ] as const
          ).map(([title, key]) => (
            <div key={key}>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-wt-text-faint">{title}</h3>
              <p className="mb-2 text-xs text-wt-text-muted">
                A percentage of the weighted KPI score, added on top. The lower rate applies up to the count
                below; the higher rate above it.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <InputField
                  label="Lower rate (%)"
                  type="number"
                  value={form[`${key}_low_rate_percent`]}
                  onChange={(v) => set(`${key}_low_rate_percent`, v)}
                />
                <InputField
                  label="Lower rate up to (count)"
                  type="number"
                  value={form[`${key}_low_max`]}
                  onChange={(v) => set(`${key}_low_max`, v)}
                />
                <InputField
                  label="Higher rate (%)"
                  type="number"
                  value={form[`${key}_high_rate_percent`]}
                  onChange={(v) => set(`${key}_high_rate_percent`, v)}
                />
              </div>
            </div>
          ))}

          <div className="grid gap-3 sm:grid-cols-2">
            <InputField
              label="Promotion-eligible at score"
              type="number"
              value={form.promotion_min_score}
              onChange={(v) => set("promotion_min_score", v)}
            />
          </div>

          {payload ? (
            <div className="rounded-xl border border-wt-border bg-wt-surface-2/50 p-3 text-xs text-wt-text-muted">
              Highest reachable score: <span className="font-semibold text-wt-text">{maxScore(payload)}</span> ·
              Example (KPI 4.0, values 4.0, 2 certifications, 1 recognition):{" "}
              <span className="font-semibold text-wt-text">{previewScore(payload, 4, 4, 2, 1)}</span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-wt-text-faint">
              {saved.is_default
                ? "Using the default settings."
                : `Last changed by ${saved.updated_by ?? "—"}${saved.updated_at ? ` on ${saved.updated_at}` : ""}.`}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={busy !== null || saved.is_default}
                onClick={() => void run("reset")}
              >
                {busy === "reset" ? "Resetting…" : "Reset to defaults"}
              </Button>
              <Button
                type="button"
                disabled={busy !== null || !dirty || !payload || !weightsOk}
                onClick={() => void run("save")}
              >
                {busy === "save" ? "Saving…" : "Save scoring"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
