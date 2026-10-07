/** Google's published Core Web Vitals thresholds: [good up to, needs-improvement up to]; above that is poor. */
export const THRESHOLDS: Record<string, readonly [number, number]> = {
  FCP: [1800, 3000],
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
  TTFB: [800, 1800],
};

export type Rating = "good" | "needs-improvement" | "poor";

export function rate(name: string, value: number): Rating {
  const limits = THRESHOLDS[name];
  if (!limits) return "good";
  return value <= limits[0] ? "good" : value <= limits[1] ? "needs-improvement" : "poor";
}
