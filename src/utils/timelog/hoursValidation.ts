export const TIMELOG_HOURS_MIN = 0.5;
export const TIMELOG_HOURS_MAX = 24;
export const TIMELOG_HOURS_VALIDATION_MESSAGE = "Please enter a valid time value.";

/** Matches backend timelog hours bounds (0.5–24). */
export function validateTimelogHours(raw: string | number): string | null {
  const text = typeof raw === "number" ? String(raw) : raw.trim();
  if (!text) return TIMELOG_HOURS_VALIDATION_MESSAGE;
  const hours = Number(text);
  if (!Number.isFinite(hours) || hours < TIMELOG_HOURS_MIN || hours > TIMELOG_HOURS_MAX) {
    return TIMELOG_HOURS_VALIDATION_MESSAGE;
  }
  return null;
}
