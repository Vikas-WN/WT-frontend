import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, icon, className, action }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-wt-border bg-wt-surface-2/40 px-8 py-16 text-center dark:border-wt-border-md dark:bg-wt-surface-2",
        className
      )}
      role="status"
    >
      {icon ? (
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-wt-surface-3 text-wt-text-muted">
          {icon}
        </div>
      ) : (
        <div
          className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-wt-surface-3 text-wt-text-faint"
          aria-hidden
        >
          <span className="text-lg font-medium opacity-50">—</span>
        </div>
      )}
      <p className="text-base font-semibold tracking-tight text-wt-text">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-wt-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
