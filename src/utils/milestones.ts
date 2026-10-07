/** Work anniversaries that get the big celebration (every other year still gets the usual confetti). */
const MILESTONE_YEARS = [1, 2, 3, 5, 7, 10, 12, 15, 20, 25, 30] as const;

export function isMilestoneYear(years: number): boolean {
  return (MILESTONE_YEARS as readonly number[]).includes(years);
}

const NAMES: Record<number, string> = {
  1: "One year",
  2: "Two years",
  3: "Three years",
  5: "Five years",
  7: "Seven years",
  10: "A whole decade",
  12: "Twelve years",
  15: "Fifteen years",
  20: "Twenty years",
  25: "Twenty-five years",
  30: "Thirty years",
};

/** Headline for the milestone card, e.g. "Five years at Webknot". */
export function milestoneTitle(years: number): string {
  if (years === 10) return "A whole decade at Webknot";
  return `${NAMES[years] ?? `${years} years`} at Webknot`;
}

/** How many bursts of confetti the day deserves — a bigger number, a bigger party. */
export function milestoneBursts(years: number): number {
  if (years >= 20) return 5;
  if (years >= 10) return 4;
  if (years >= 5) return 3;
  return 2;
}
