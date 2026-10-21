import type { ReactNode } from "react";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Strong({ children, tone }: { children: ReactNode; tone: "brand" | "alert" }) {
  return <span className={tone === "alert" ? "font-medium text-rose-700 dark:text-rose-300" : "font-medium text-[var(--wt-brand)]"}>{children}</span>;
}

/**
 * The line under the greeting: "You have 16 approvals and 1 overdue training. Office is closed tomorrow for Dussehra."
 * Counts that are zero are left out; when there is nothing to say it falls back to `fallback`.
 */
export function HomeSummaryLine({ approvals, overdueTrainings, closedTomorrow, fallback }: { approvals: number | null; overdueTrainings: number; closedTomorrow: string | null; fallback: string | null }) {
  const items: ReactNode[] = [];
  if (approvals) items.push(<Strong key="a" tone="brand">{plural(approvals, "approval", "approvals")}</Strong>);
  if (overdueTrainings) items.push(<Strong key="t" tone="alert">{plural(overdueTrainings, "overdue training", "overdue trainings")}</Strong>);
  if (items.length === 0 && !closedTomorrow) return fallback;
  return (
    <>
      {items.length ? (
        <>
          You have {items[0]}
          {items[1] ? <> and {items[1]}</> : null}.{" "}
        </>
      ) : null}
      {closedTomorrow ? <>Office is closed tomorrow for {closedTomorrow}.</> : null}
    </>
  );
}
