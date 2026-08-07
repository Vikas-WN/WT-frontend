"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { cn } from "@/lib/utils";

type ComingSoonPanelProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  className?: string;
  /** When false, render without DashboardPageShell (e.g. already inside LearningPageShell). */
  withShell?: boolean;
};

export function ComingSoonPanel({
  title,
  description = "We're polishing this experience. Everything behind the scenes stays wired — you'll get access as soon as it launches.",
  eyebrow = "Coming soon",
  icon,
  className,
  withShell = true,
}: ComingSoonPanelProps) {
  const body = (
    <div
      className={cn(
        "relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-wt-border bg-wt-surface-1 p-8 shadow-[var(--wt-shadow-md)] wt-soft-in dark:bg-wt-surface-2 dark:shadow-none sm:p-12",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--wt-brand)_18%,transparent),transparent_55%)]" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-[color-mix(in_srgb,var(--wt-brand)_12%,transparent)] blur-3xl" />
      <div className="relative flex flex-col items-center text-center">
        <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-[var(--wt-brand)] text-white shadow-lg shadow-[color-mix(in_srgb,var(--wt-brand)_35%,transparent)]">
          {icon ?? <Sparkles className="size-6" />}
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-wt-text-faint">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-wt-text sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-wt-text-muted">{description}</p>
        <div className="mt-8 h-1.5 w-24 overflow-hidden rounded-full bg-wt-surface-3">
          <div className="h-full w-2/5 animate-pulse rounded-full bg-[var(--wt-brand)]" />
        </div>
      </div>
    </div>
  );

  if (!withShell) return body;
  return <DashboardPageShell className="flex items-center justify-center">{body}</DashboardPageShell>;
}
