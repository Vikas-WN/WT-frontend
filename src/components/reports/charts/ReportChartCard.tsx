"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ReportChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-wt-border bg-wt-surface-1 overflow-hidden shadow-sm",
        className
      )}
    >
      <div className="border-b border-wt-border bg-wt-surface-1 px-4 py-3 sm:px-5">
        <h4 className="font-semibold text-sm">{title}</h4>
        {description ? (
          <p className="text-xs text-wt-text-muted mt-0.5">{description}</p>
        ) : null}
      </div>
      <div className="px-2 py-4 sm:px-4">{children}</div>
    </section>
  );
}
