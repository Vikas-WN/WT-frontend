import type { ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUILabel } from "@/utils/titleCase";
import { CONTENT_CARD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  loading,
  icon: Icon,
}: {
  label: string;
  value: number;
  loading: boolean;
  icon?: ComponentType<{ className?: string }>;
}) {
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
        <p className="mt-2 text-3xl font-semibold tracking-tight text-wt-text tabular-nums">
          {value.toLocaleString()}
        </p>
      )}
    </article>
  );
}
