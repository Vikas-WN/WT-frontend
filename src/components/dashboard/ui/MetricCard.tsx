import type { ComponentType } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUILabel } from "@/utils/titleCase";
import { CONTENT_CARD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";

export type MetricTrend = {
  direction: "up" | "down" | "flat";
  label: string;
  /** "up"=good news framed positive (emerald), "down"=bad news framed negative
   *  (rose) — independent of arrow direction, since "down" isn't always bad
   *  (e.g. fewer pending approvals). Defaults to a neutral tone when omitted. */
  tone?: "positive" | "negative" | "neutral";
};

const TREND_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const;
const TREND_TONE_CLASS = {
  positive: "text-emerald-700 dark:text-emerald-400",
  negative: "text-rose-700 dark:text-rose-400",
  neutral: "text-wt-text-muted",
} as const;

export function MetricCard({
  label,
  value,
  loading,
  icon: Icon,
  trend,
}: {
  label: string;
  value: number;
  loading: boolean;
  icon?: ComponentType<{ className?: string }>;
  /** Optional delta/trend chip shown under the value, e.g. "+3 this week". */
  trend?: MetricTrend;
}) {
  const TrendIcon = trend ? TREND_ICON[trend.direction] : null;
  return (
    <article
      className={cn(
        CONTENT_CARD_CLASS,
        "group/metric p-5 transition-[border-color,box-shadow] duration-[var(--wt-duration)] ease-[var(--wt-ease)] sm:p-6"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-wt-text-muted">{formatUILabel(label)}</p>
        {Icon ? (
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--wt-brand-soft)] text-[var(--wt-brand)] transition-transform duration-[var(--wt-duration)] ease-[var(--wt-ease)] group-hover/metric:scale-105">
            <Icon className="size-4.5" aria-hidden />
          </span>
        ) : null}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-24" />
      ) : (
        <>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-wt-text tabular-nums">
            {value.toLocaleString()}
          </p>
          {trend ? (
            <p
              className={cn(
                "mt-1.5 flex items-center gap-1 text-xs font-medium",
                TREND_TONE_CLASS[trend.tone ?? "neutral"]
              )}
            >
              {TrendIcon ? <TrendIcon className="size-3.5" aria-hidden /> : null}
              {trend.label}
            </p>
          ) : null}
        </>
      )}
    </article>
  );
}
