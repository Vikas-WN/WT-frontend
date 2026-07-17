export const LEARNING_BASE = "/dashboard/learning-development" as const;

/**
 * L&D sidebar children — open Overview, then manage trainings from cards.
 * Attendance / scores live inside each training detail.
 */
export const learningSubNav = [
  { href: `${LEARNING_BASE}`, label: "Overview", segment: "" },
  { href: `${LEARNING_BASE}/trainings`, label: "Trainings", segment: "trainings" },
] as const;
