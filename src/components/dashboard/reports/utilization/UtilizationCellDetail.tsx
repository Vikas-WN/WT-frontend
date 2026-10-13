import { UTILIZATION_COPY as COPY } from "@/constants/utilizationHeatmap";
import type { UtilizationPerson } from "@/types/utilization";
import { parseApiDate } from "@/utils/apiDate";
import { percentLabel, shortDay } from "@/utils/utilizationDisplay";

/** What is behind a cell: planned vs logged for that person and week, and any approved leave. */
export function UtilizationCellDetail({ person, index }: { person: UtilizationPerson; index: number }) {
  const cell = person.weeks[index];
  const date = parseApiDate(cell.week_start);
  return (
    <aside className="rounded-2xl border border-wt-border bg-wt-surface-1 p-4" aria-live="polite">
      <p className="text-sm font-semibold text-wt-text">
        {person.name} <span className="font-normal text-wt-text-muted">· {person.department}</span>
      </p>
      <p className="text-xs text-wt-text-muted">{date ? COPY.focusWeek(shortDay(date)) : cell.week_start}</p>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-wt-text-muted">{COPY.detailPlanned}</dt>
          <dd className="text-lg font-semibold tabular-nums text-wt-text">{percentLabel(cell.planned_percent)}</dd>
        </div>
        <div>
          <dt className="text-xs text-wt-text-muted">{COPY.detailActual}</dt>
          <dd className="text-lg font-semibold tabular-nums text-wt-text">
            {COPY.detailHours(cell.logged_hours)} <span className="text-xs font-normal text-wt-text-muted">({percentLabel(cell.actual_percent)})</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-wt-text-muted">{COPY.detailLeave}</dt>
          <dd className="text-lg font-semibold tabular-nums text-wt-text">{COPY.detailDays(cell.leave_days)}</dd>
        </div>
      </dl>
    </aside>
  );
}
