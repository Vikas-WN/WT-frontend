import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { formatUILabel } from "@/utils/titleCase";

/**
 * Page-level hero header — consistent title hierarchy across dashboard routes.
 *
 * `surface` opts into a bordered, brand-tinted card treatment (used by Home)
 * instead of the default bare header — existing callers are unaffected since
 * it defaults to off. `raw` skips the automatic title-casing for content that
 * shouldn't be reshaped, like a personalized greeting ("Good morning, Asha").
 */
export function PageHero({
  title,
  description,
  eyebrow,
  action,
  className,
  surface = false,
  raw = false,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  surface?: boolean;
  raw?: boolean;
}) {
  return (
    <header
      className={cn(
        "relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        surface && "overflow-hidden rounded-3xl border border-wt-border bg-wt-surface-1 px-5 py-6 sm:px-8 sm:py-8",
        className
      )}
    >
      {surface ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_100%_at_0%_0%,color-mix(in_srgb,var(--wt-brand)_7%,transparent),transparent_60%)]"
          aria-hidden
        />
      ) : null}
      <div className="relative min-w-0 max-w-2xl space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wt-brand)]">
            {formatUILabel(eyebrow)}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-wt-text sm:text-[1.75rem] sm:leading-tight">
          {raw ? title : formatUILabel(title)}
        </h1>
        {description ? (
          <p className="text-sm leading-relaxed text-wt-text-muted sm:text-[0.9375rem]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="relative flex shrink-0 flex-wrap items-center gap-3">{action}</div>
      ) : null}
    </header>
  );
}
