import { Building2, CalendarOff, Home as HomeIcon } from "lucide-react";
import type { ReactNode } from "react";

export type BucketKey = "office" | "work_from_home" | "on_leave";

export const BUCKET_ORDER: readonly BucketKey[] = ["office", "work_from_home", "on_leave"];

/** One look per bucket, shared by the card's bar, its rows and the people dialog so they always agree. */
export const BUCKET_META: Record<BucketKey, { label: string; short: string; icon: ReactNode; tone: string; bar: string }> = {
  office: {
    label: "In Office",
    short: "Office",
    icon: <Building2 className="size-3.5" />,
    tone: "text-[var(--wt-brand)] bg-[var(--wt-brand-soft)]",
    bar: "bg-[var(--wt-brand)]",
  },
  work_from_home: {
    label: "Work From Home",
    short: "Remote",
    icon: <HomeIcon className="size-3.5" />,
    tone: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/12",
    bar: "bg-emerald-500",
  },
  on_leave: {
    label: "On Leave",
    short: "On leave",
    icon: <CalendarOff className="size-3.5" />,
    tone: "text-amber-700 dark:text-amber-400 bg-amber-500/12",
    bar: "bg-amber-500",
  },
};

export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
