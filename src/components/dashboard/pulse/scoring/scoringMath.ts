import type { PulseScoreSettingsWrite } from "@/types/kpi";

type PulseScoringPayload = PulseScoreSettingsWrite;

export type ScoringForm = Record<keyof PulseScoreSettingsWrite, string>;

export const SCORING_FIELDS: (keyof PulseScoreSettingsWrite)[] = [
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

export const toForm = (s: PulseScoreSettingsWrite): ScoringForm =>
  Object.fromEntries(SCORING_FIELDS.map((f) => [f, String(s[f])])) as ScoringForm;

/** null until every field holds a number. */
export function toPayload(form: ScoringForm): PulseScoreSettingsWrite | null {
  const out = {} as PulseScoreSettingsWrite;
  for (const f of SCORING_FIELDS) {
    const n = Number(form[f]);
    if (form[f].trim() === "" || !Number.isFinite(n)) return null;
    out[f] = n;
  }
  return out;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Ratings run 1-5, so no score may exceed 5 — bonuses included. Mirrors SCORE_CEILING in app/domain/kpi_score.py. */
export const SCORE_CEILING = 5;
const capScore = (n: number) => Math.min(SCORE_CEILING, n);
const clamp15 = (n: number) => Math.round(Math.min(5, Math.max(1, n)) * 10) / 10;

/** Mirrors app/domain/kpi_score.py so HR sees the effect before saving. */
export function previewScore(s: PulseScoreSettingsWrite, kpi: number, values: number, certs: number, recs: number) {
  const x = (s.kpi_weight_percent / 100) * clamp15(kpi);
  const y = (s.values_weight_percent / 100) * clamp15(values);
  const bonus = (count: number, low: number, high: number, lowMax: number) =>
    count <= 0 ? 0 : x * ((count <= lowMax ? low : high) / 100);
  return round2(
    capScore(
      x + y +
        bonus(certs, s.certification_low_rate_percent, s.certification_high_rate_percent, s.certification_low_max) +
        bonus(recs, s.recognition_low_rate_percent, s.recognition_high_rate_percent, s.recognition_low_max)
    )
  );
}

/** What the formula gives with every average at 5 and both bonuses at their high rate, before the ceiling. */
export function uncappedMaxScore(s: PulseScoreSettingsWrite) {
  const topKpi = (s.kpi_weight_percent / 100) * 5;
  return round2(topKpi + (s.values_weight_percent / 100) * 5 + topKpi * ((s.certification_high_rate_percent + s.recognition_high_rate_percent) / 100));
}

/** Highest reachable score — never above the 5.0 ceiling, bonuses included. */
export function maxScore(s: PulseScoringPayload) {
  return Math.min(SCORE_CEILING, uncappedMaxScore(s));
}
