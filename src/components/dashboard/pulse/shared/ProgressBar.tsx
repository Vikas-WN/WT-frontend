import { cn } from "@/lib/utils";

/** Thin completion bar; turns green once everything is done. */
export function ProgressBar({ done, total, className }: { done: number; total: number; className?: string }) {
  const pct = total === 0 ? 100 : Math.min(100, Math.round((done / total) * 100));
  return (
    <div
      className={cn("h-1.5 overflow-hidden rounded-full bg-wt-surface-3", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-300", pct === 100 ? "bg-emerald-500" : "bg-[var(--wt-brand)]")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
