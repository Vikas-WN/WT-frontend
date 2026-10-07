"use client";

import { Lock } from "lucide-react";

import { WINDOW_SCOPE_LABELS } from "@/constants/pulse";
import { cn } from "@/lib/utils";
import type { SubmissionWindowStatus } from "@/types/kpi";

/** "Open until 5 Oct · everyone" / "Closed" — whether Pulse accepts input
 *  for the month being looked at. */
export function WindowPill({
  status,
  loading = false,
  openLabel = "Open",
  closedLabel = "Closed",
}: {
  status: SubmissionWindowStatus | undefined;
  loading?: boolean;
  openLabel?: string;
  closedLabel?: string;
}) {
  if (loading || !status) {
    return <span className="h-7 w-28 animate-pulse rounded-full bg-wt-surface-3" aria-label="Checking window" />;
  }
  const Icon = Lock;
  const via = status.open && status.resolved_scope ? WINDOW_SCOPE_LABELS[status.resolved_scope] : null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        status.open
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400"
      )}
    >
      {status.open ? (
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60 motion-reduce:hidden" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
      ) : (
        <Icon className="size-3.5" aria-hidden />
      )}
      {status.open ? openLabel : closedLabel}
      {status.open && status.window_end_at ? <span className="font-normal opacity-80">· until {status.window_end_at.slice(0, 16)}</span> : null}
      {via ? <span className="font-normal opacity-80">· {via.toLowerCase()}</span> : null}
    </span>
  );
}
