"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { hrmsService } from "@/services/hrms.service";
import type { TeamTrainingCompletionRow } from "@/types/learning";
import { cn } from "@/lib/utils";

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

export function TeamTrainingCompletionPanel() {
  const rows = useLoad<TeamTrainingCompletionRow[]>(
    () => hrmsService.getTeamTrainingCompletion().then((r) => r.data ?? []),
    []
  );

  const data = rows.data ?? [];
  const overdueCount = data.filter((r) => r.is_overdue).length;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-wt-text">Team training completion</h2>
          <p className="mt-0.5 text-sm text-wt-text-muted">
            Your direct reports&apos; enrollments and mandatory-deadline status.
          </p>
        </div>
        {overdueCount > 0 ? (
          <Badge variant="destructive">
            {overdueCount} overdue
          </Badge>
        ) : null}
      </div>

      {rows.status === "loading" ? (
        <SectionLoading label="" />
      ) : data.length === 0 ? (
        <EmptyState title="No Enrollments Yet" description="Your reports haven't enrolled in any trainings." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-wt-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-wt-surface-2/60 text-xs font-semibold uppercase tracking-wide text-wt-text-muted">
              <tr>
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Training</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Progress</th>
                <th className="px-4 py-2.5">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wt-border">
              {data.map((row) => (
                <tr
                  key={`${row.user_id}-${row.training_id}`}
                  className={cn(row.is_overdue && "bg-rose-500/5")}
                >
                  <td className="px-4 py-2.5 font-medium text-wt-text">{row.name}</td>
                  <td className="px-4 py-2.5 text-wt-text-muted">
                    {row.training_name}
                    {row.is_mandatory ? (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Mandatory
                      </Badge>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={row.enrollment_status === "COMPLETED" ? "default" : "outline"}>
                      {row.enrollment_status ?? "IN PROGRESS"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-wt-text-muted">{row.progress_percent}%</td>
                  <td className="px-4 py-2.5">
                    {row.completion_deadline ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          row.is_overdue ? "font-medium text-rose-600 dark:text-rose-400" : "text-wt-text-muted"
                        )}
                      >
                        {row.is_overdue ? <AlertTriangle className="size-3.5" /> : null}
                        {row.completion_deadline}
                      </span>
                    ) : (
                      <span className="text-wt-text-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
