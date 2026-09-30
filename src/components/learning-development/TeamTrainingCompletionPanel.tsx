"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { hrmsService } from "@/services/hrms.service";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WT_STICKY_TABLE_HEAD_CLASS,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
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
        <ScrollableTable maxHeightClass="max-h-[min(60vh,520px)]">
          <WtTable>
            <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
              <TableRow className="hover:bg-transparent">
                <TableHead>Employee</TableHead>
                <TableHead>Training</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={`${row.user_id}-${row.training_id}`}
                  className={cn(row.is_overdue && "bg-rose-500/5 hover:bg-rose-500/10")}
                >
                  <TableCell className="font-medium text-wt-text">{row.name}</TableCell>
                  <TableCell className="whitespace-normal">
                    {row.training_name}
                    {row.is_mandatory ? (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Mandatory
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.enrollment_status === "COMPLETED" ? "default" : "outline"}>
                      {row.enrollment_status ?? "IN PROGRESS"}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{row.progress_percent}%</TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </WtTable>
        </ScrollableTable>
      )}
    </section>
  );
}
