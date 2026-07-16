import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { formatUILabel } from "@/utils/titleCase";

/**
 * Page-level hero header — consistent title hierarchy across dashboard routes.
 */
export function PageHero({
  title,
  description,
  eyebrow,
  action,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 max-w-2xl space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wt-brand)]">
            {formatUILabel(eyebrow)}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-wt-text sm:text-[1.75rem] sm:leading-tight">
          {formatUILabel(title)}
        </h1>
        {description ? (
          <p className="text-sm leading-relaxed text-wt-text-muted sm:text-[0.9375rem]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div> : null}
    </header>
  );
}
