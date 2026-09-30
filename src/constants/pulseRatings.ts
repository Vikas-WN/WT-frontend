/**
 * Pulse rating scale. Reviewers pick a level by name — the digit is never shown
 * (it is still what the API stores, 1-5). Mirrors `_RATING_LABELS` in the
 * backend's `app/domain/kpi_score.py`.
 */
export interface PulseRatingLevel {
  value: number;
  label: string;
}

export const PULSE_RATING_LEVELS: readonly PulseRatingLevel[] = [
  { value: 1, label: "Poor Performance" },
  { value: 2, label: "Below Expectations" },
  { value: 3, label: "Meets Expectations" },
  { value: 4, label: "Above Expectations" },
  { value: 5, label: "Exceptional" },
];

const LABEL_BY_VALUE = new Map(PULSE_RATING_LEVELS.map((level) => [level.value, level.label]));

/** "Meets Expectations" for 3; an em dash when there is no rating yet. */
export function pulseRatingLabel(value: number | null | undefined): string {
  return value == null ? "—" : (LABEL_BY_VALUE.get(value) ?? "—");
}
