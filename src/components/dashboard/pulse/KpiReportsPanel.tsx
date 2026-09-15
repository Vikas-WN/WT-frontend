"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronRight, Search } from "lucide-react";

import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { Input } from "@/components/ui/input";
import { hrmsService } from "@/services/hrms.service";
import {
  HistorySection,
  SummarySection,
} from "@/components/dashboard/pulse/employee/MyKpiSummaryPanel";
import type { AllTimeKpiSummary, EmployeeSummary, MonthlySubmissionItem } from "@/types/kpi";

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

/** Every employee with at least one KPI submission — built client-side from
 *  the full submissions list rather than a dedicated employee-search
 *  endpoint, since that list already carries each employee's numeric id. */
function distinctEmployees(rows: MonthlySubmissionItem[]): EmployeeSummary[] {
  const byId = new Map<number, EmployeeSummary>();
  for (const row of rows) {
    if (!byId.has(row.employee.id)) byId.set(row.employee.id, row.employee);
  }
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/** Admin/HR report: browse any employee's all-time KPI summary and
 *  submission history — the same view an employee gets for themselves
 *  (MyKpiSummaryPanel), but selectable for anyone with a submission. */
export function KpiReportsPanel() {
  const submissionsQuery = useLoad<MonthlySubmissionItem[]>(() =>
    hrmsService.listAllMonthlySubmissions({})
  );
  const employees = useMemo(
    () => distinctEmployees(submissionsQuery.data ?? []),
    [submissionsQuery.data]
  );

  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.emp_id ?? "").toLowerCase().includes(q)
    );
  }, [employees, search]);

  const [selected, setSelected] = useState<EmployeeSummary | null>(null);

  const summaryQuery = useLoad<AllTimeKpiSummary>(
    () =>
      selected
        ? hrmsService.getUserKpiSummary(selected.id)
        : Promise.reject(new Error("no selection")),
    [selected?.id]
  );
  const historyQuery = useLoad<MonthlySubmissionItem[]>(
    () =>
      selected
        ? hrmsService.getUserMonthlySubmissions(selected.id)
        : Promise.reject(new Error("no selection")),
    [selected?.id]
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-faint" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee…"
            className="pl-9"
          />
        </div>

        {submissionsQuery.status === "loading" ? (
          <SectionLoading label="" />
        ) : submissionsQuery.status === "error" ? (
          <EmptyState title="Couldn't load employees" className="py-8" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No employees found"
            description="No one has a KPI submission yet."
            className="py-8"
          />
        ) : (
          <ul className="max-h-[min(65vh,560px)] space-y-1 overflow-y-auto rounded-xl border border-wt-border p-1.5">
            {filtered.map((emp) => (
              <li key={emp.id}>
                <button
                  type="button"
                  onClick={() => setSelected(emp)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                    selected?.id === emp.id
                      ? "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]"
                      : "hover:bg-wt-surface-2"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{emp.name}</span>
                    <span className="block truncate text-xs text-wt-text-muted">
                      {emp.emp_id ?? emp.email}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-wt-text-faint" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="min-w-0">
        {!selected ? (
          <EmptyState
            title="Pick an employee"
            description="Select someone from the list to see their all-time KPI summary and history."
            icon={<BarChart3 className="size-6" />}
            className="py-16"
          />
        ) : (
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-wt-text">{selected.name}</h3>
            {summaryQuery.status === "loading" ? (
              <SectionLoading label="" />
            ) : summaryQuery.status === "error" || !summaryQuery.data ? (
              <EmptyState title="Couldn't load summary" className="py-8" />
            ) : summaryQuery.data.total_submissions === 0 ? (
              <EmptyState title="No submissions yet" className="py-8" />
            ) : (
              <SummarySection summary={summaryQuery.data} />
            )}

            <div>
              <h4 className="text-sm font-semibold text-wt-text">Submission history</h4>
              <div className="mt-3">
                {historyQuery.status === "loading" ? (
                  <SectionLoading label="" />
                ) : historyQuery.status === "error" ? (
                  <EmptyState title="Couldn't load history" className="py-8" />
                ) : (
                  <HistorySection rows={historyQuery.data ?? []} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
