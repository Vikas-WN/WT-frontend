/** How long the reason / comments on a leave, WFH or comp-off request may be. The server enforces the same number. */
export const REQUEST_REASON_MAX_LENGTH = 500;

/** The counter turns to a warning once this share of the limit is used. */
export const REASON_WARN_FRACTION = 0.9;

export const REASON_COPY = {
  hint: (max: number) => `Keep it brief — up to ${max} characters.`,
  counter: (used: number, max: number) => `${used} / ${max}`,
  nearLimit: (left: number) => `${left} ${left === 1 ? "character" : "characters"} left`,
  atLimit: (max: number) => `Limit reached (${max} characters).`,
  pasteTrimmed: (max: number) => `Your pasted text was shortened to fit ${max} characters.`,
  validation: (max: number) => `Comments (${max} characters or less)`,
  toast: (max: number) => `Reason must be ${max} characters or less.`,
} as const;
