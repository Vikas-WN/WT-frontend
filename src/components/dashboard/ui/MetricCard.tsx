import { Skeleton } from "@/components/ui/skeleton";
import { formatUILabel } from "@/utils/titleCase";
import { CONTENT_CARD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <article
      className={cn(
        CONTENT_CARD_CLASS,
        "p-5 transition-[border-color,box-shadow] duration-[var(--wt-duration)] ease-[var(--wt-ease)] sm:p-6"
      )}
    >
      <p className="text-sm font-medium text-wt-text-muted">{formatUILabel(label)}</p>
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
