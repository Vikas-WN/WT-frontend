"use client";

import { useEffect, useState } from "react";
import { Award, TrendingUp } from "lucide-react";

import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { hrmsService } from "@/services/hrms.service";
import type { AllTimeKpiSummary, MonthlySubmissionItem } from "@/types/kpi";

type Load<T> = { status: "loading" | "done" | "error"; data: T | null };

/** Local copy of the small async-fetch hook used across dashboard pages —
 *  kept file-local rather than shared (see HomePageClient's own copy). */
function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []): Load<T> {
  const [state, setState] = useState<Load<T>>({ status: "loading", data: null });
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await fn();
        if (alive) setState({ status: "done", data });
      } catch {
        if (alive) setState({ status: "error", data: null });
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

function scoreCell(value: number | null): string {
  return value == null ? "—" : value.toFixed(2);
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  return (
    <div className="rounded-xl border border-wt-border bg-wt-surface-1 px-4 py-3">
      <p className="text-xs text-wt-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-wt-text">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-wt-text-muted">{sub}</p> : null}
    </div>
  );
}

/** Exported for reuse by KpiReportsPanel.tsx (admin browsing any employee's summary). */
export function SummarySection({ summary }: { summary: AllTimeKpiSummary }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total submissions" value={String(summary.total_submissions)} />
        <StatTile label="Reviewed" value={String(summary.reviewed_submissions)} />
        <StatTile
          label="Your rating"
          value={scoreCell(summary.employee_rating_average)}
          sub={summary.employee_rating_display}
        />
        <StatTile
          label="Manager rating"
          value={scoreCell(summary.manager_rating_average)}
          sub={summary.manager_rating_display}
        />
        <StatTile
          label="Admin (final) rating"
          value={scoreCell(summary.admin_rating_average)}
          sub={summary.admin_rating_display}
        />
        <StatTile label="All-time KPI average" value={scoreCell(summary.all_time_kpi_average)} />
        <StatTile
          label="All-time manager KPI average"
          value={scoreCell(summary.all_time_manager_kpi_average)}
        />
      </div>

      {summary.cycles.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold text-wt-text">By cycle</h4>
          <div className="mt-2 overflow-x-auto rounded-xl border border-wt-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-wt-surface-2/60 text-xs text-wt-text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Cycle</th>
                  <th className="px-3 py-2 font-medium">Submissions</th>
                  <th className="px-3 py-2 font-medium">Your rating</th>
                  <th className="px-3 py-2 font-medium">Manager rating</th>
                  <th className="px-3 py-2 font-medium">Admin rating</th>
                </tr>
              </thead>
              <tbody>
                {summary.cycles.map((cycle) => (
                  <tr key={cycle.cycle_key} className="border-t border-wt-border">
                    <td className="px-3 py-2 text-wt-text">{cycle.cycle_label}</td>
                    <td className="px-3 py-2 text-wt-text-muted">{cycle.submissions}</td>
                    <td className="px-3 py-2 text-wt-text-muted">
                      {scoreCell(cycle.employee_rating_average)}
                      {cycle.employee_rating_display ? ` · ${cycle.employee_rating_display}` : ""}
                    </td>
                    <td className="px-3 py-2 text-wt-text-muted">
                      {scoreCell(cycle.manager_rating_average)}
                      {cycle.manager_rating_display ? ` · ${cycle.manager_rating_display}` : ""}
                    </td>
                    <td className="px-3 py-2 text-wt-text-muted">
                      {scoreCell(cycle.admin_rating_average)}
                      {cycle.admin_rating_display ? ` · ${cycle.admin_rating_display}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Exported for reuse by KpiReportsPanel.tsx (admin browsing any employee's history). */
export function HistorySection({ rows }: { rows: MonthlySubmissionItem[] }) {
  if (rows.length === 0) {
    return <EmptyState title="No submission history" description="Your past monthly reviews will show up here." />;
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-1 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-wt-text">{row.cycle_label}</p>
            <p className="text-xs text-wt-text-muted">{row.month}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge variant="outline">{row.review_status ?? row.status}</Badge>
            {row.final_score != null ? (
              <Badge variant="outline">
                Score {row.final_score}
                {row.admin_rating_display ? ` · ${row.admin_rating_display}` : ""}
              </Badge>
            ) : null}
            {row.promotion_eligible ? (
              <Badge className="border-emerald-300 bg-emerald-50 text-emerald-700">Promotion eligible</Badge>
            ) : null}
            {row.locked ? <Badge variant="outline">Locked</Badge> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Employee-facing all-time KPI summary and submission history — read-only. */
export function MyKpiSummaryPanel() {
  const summary = useLoad<AllTimeKpiSummary>(() => hrmsService.getMyKpiSummary());
  const history = useLoad<MonthlySubmissionItem[]>(() => hrmsService.getMyMonthlySubmissionHistory());

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-wt-text">
          <TrendingUp className="size-4 text-wt-text-faint" />
          All-time KPI summary
        </h3>
        {summary.status === "loading" ? (
          <SectionLoading label="" />
        ) : summary.status === "error" || !summary.data ? (
          <EmptyState title="Couldn't load your summary" description="Try again in a moment." />
        ) : summary.data.total_submissions === 0 ? (
          <EmptyState
            title="No submissions yet"
            description="Your KPI summary will appear once you have a reviewed submission."
          />
        ) : (
          <div className="mt-3">
            <SummarySection summary={summary.data} />
          </div>
        )}
      </div>

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-wt-text">
          <Award className="size-4 text-wt-text-faint" />
          Submission history
        </h3>
        <div className="mt-3">
          {history.status === "loading" ? (
            <SectionLoading label="" />
          ) : history.status === "error" ? (
            <EmptyState title="Couldn't load your history" description="Try again in a moment." />
          ) : (
            <HistorySection rows={history.data ?? []} />
          )}
        </div>
      </div>
    </div>
  );
}
