import { cn } from "@/lib/utils";

/** Semantic banner surfaces — opacity-based tints that work in light and dark mode. */
export const BANNER_TONE = {
  success:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning:
    "border-amber-500/25 bg-amber-500/10 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200",
  info:
    "border-sky-500/25 bg-sky-500/10 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-200",
  danger:
    "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
  accent:
    "border-indigo-500/25 bg-indigo-500/10 text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-200",
  violet:
    "border-violet-500/25 bg-violet-500/10 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300",
  neutral: "border-wt-border bg-wt-surface-2/60 text-wt-text",
} as const;

export type BannerTone = keyof typeof BANNER_TONE;

const BANNER_SHELL = "rounded-xl border px-4 py-3 text-sm";
const BANNER_SHELL_LG = "rounded-2xl border text-sm";

export function bannerClass(tone: BannerTone, extra?: string): string {
  return cn(BANNER_SHELL, BANNER_TONE[tone], extra);
}

export function bannerLargeClass(tone: BannerTone, extra?: string): string {
  return cn(BANNER_SHELL_LG, "p-4", BANNER_TONE[tone], extra);
}

export function bannerPanelClass(tone: BannerTone, extra?: string): string {
  return cn("rounded-lg border p-4 text-sm", BANNER_TONE[tone], extra);
}

export function bannerInlineClass(tone: BannerTone, extra?: string): string {
  return cn("rounded-lg border px-3 py-2 text-sm", BANNER_TONE[tone], extra);
}

export function statusChipClass(tone: BannerTone, extra?: string): string {
  return cn(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
    BANNER_TONE[tone],
    extra
  );
}

export function bulkResultClass(status: string): string {
  if (status === "SENT") return cn("rounded-lg border", BANNER_TONE.success);
  if (status === "FAILED") return cn("rounded-lg border", BANNER_TONE.danger);
  return cn("rounded-lg border", BANNER_TONE.warning);
}

export const BANNER_TITLE_CLASS = "font-medium";
export const BANNER_BODY_CLASS = "mt-1 leading-relaxed opacity-90";
export const BANNER_LIST_CLASS = "list-disc space-y-0.5 pl-5 opacity-90";
export const BANNER_LINK_CLASS =
  "mt-2 inline-block font-medium underline-offset-2 hover:underline";

/** Tinted surfaces without a border — stat cards, compact highlights. */
export const SURFACE_TINT = {
  success: "bg-emerald-500/10 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning: "bg-amber-500/10 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
  info: "bg-sky-500/10 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  danger: "bg-rose-500/10 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  accent: "bg-indigo-500/10 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300",
  violet: "bg-violet-500/10 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
} as const;

export type SurfaceTint = keyof typeof SURFACE_TINT;

export function surfaceTintClass(tone: SurfaceTint, extra?: string): string {
  return cn(SURFACE_TINT[tone], extra);
}
