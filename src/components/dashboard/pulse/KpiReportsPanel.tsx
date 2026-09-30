"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronDown, ChevronRight, Download, Search } from "lucide-react";

import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminReviewModal, RatingsComparison } from "@/components/dashboard/pulse/SubmissionsReviewPanel";
import { downloadCsvFile } from "@/utils/parseSpreadsheetFile";
import { cn } from "@/lib/utils";
import { hrmsService } from "@/services/hrms.service";
import { SummarySection } from "@/components/dashboard/pulse/employee/MyKpiSummaryPanel";
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

/** Admin/HR report: pick anyone with a submission and see their all-time
 *  summary, per-KPI employee-vs-manager averages, and every cycle's full
 *  side-by-side breakdown — with the review one click away for edits. */
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
          // Keyed by employee so switching remounts with a fresh loading
          // state — otherwise the previous person's numbers show under the
          // new name until the next fetch lands.
          <EmployeeReport key={selected.id} employee={selected} />
        )}
      </div>
    </div>
  );
}

function EmployeeReport({ employee }: { employee: EmployeeSummary }) {
  const [reloadTick, setReloadTick] = useState(0);
  const summaryQuery = useLoad<AllTimeKpiSummary>(() => hrmsService.getUserKpiSummary(employee.id), [reloadTick]);
  const historyQuery = useLoad<MonthlySubmissionItem[]>(
    () => hrmsService.getUserMonthlySubmissions(employee.id, { submissionType: "EMPLOYEE_MONTHLY_SUBMISSION" }),
    [reloadTick]
  );
  const history = useMemo(
    () =>
      (historyQuery.data ?? [])
        .filter((row) => row.review_status !== "DRAFT")
        .sort((a, b) => b.month.localeCompare(a.month)),
    [historyQuery.data]
  );
  const breakdown = useMemo(() => perItemBreakdown(history), [history]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reviewing, setReviewing] = useState<MonthlySubmissionItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-wt-text">{employee.name}</h3>
          <p className="text-xs text-wt-text-muted">{employee.emp_id ?? employee.email}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={history.length === 0}
          onClick={() => downloadEmployeeReport(employee, history)}
        >
          <Download className="mr-1.5 size-3.5" /> Download CSV
        </Button>
      </div>

      {summaryQuery.status === "loading" ? (
        <SectionLoading label="" />
      ) : summaryQuery.status === "error" || !summaryQuery.data ? (
        <EmptyState title="Couldn't load summary" className="py-8" />
      ) : summaryQuery.data.total_submissions === 0 ? (
        <EmptyState title="No submissions yet" className="py-8" />
      ) : (
        <SummarySection summary={summaryQuery.data} />
      )}

      {breakdown.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold text-wt-text">Rating by KPI and value</h4>
          <p className="mt-0.5 text-xs text-wt-text-muted">
            Averages across every submitted cycle. Gap = manager minus employee.
          </p>
          <ScrollableTable maxHeightClass="max-h-[min(55vh,480px)]" className="mt-2">
            <WtTable>
              <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Employee avg</TableHead>
                  <TableHead className="text-center">Manager avg</TableHead>
                  <TableHead className="text-center">Gap</TableHead>
                  <TableHead className="text-center">Cycles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdown.map((item) => {
                  const gap = item.self != null && item.manager != null ? item.manager - item.self : null;
                  return (
                    <TableRow key={item.key}>
                      <TableCell className="whitespace-normal">
                        <p className="text-wt-text">{item.label}</p>
                        <p className="text-xs text-wt-text-faint">{item.meta}</p>
                      </TableCell>
                      <TableCell className="text-center text-wt-text">{fmt(item.self)}</TableCell>
                      <TableCell className="text-center font-semibold text-wt-text">{fmt(item.manager)}</TableCell>
                      <TableCell
                        className={cn(
                          "text-center",
                          gap == null || Math.abs(gap) < 0.5
                            ? "text-wt-text-muted"
                            : gap > 0
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-amber-700 dark:text-amber-400"
                        )}
                      >
                        {gap == null ? "—" : `${gap > 0 ? "+" : ""}${gap.toFixed(2)}`}
                      </TableCell>
                      <TableCell className="text-center text-wt-text-muted">{item.count}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </WtTable>
          </ScrollableTable>
        </div>
      ) : null}

      <div>
        <h4 className="text-sm font-semibold text-wt-text">Submissions</h4>
        <div className="mt-3">
          {historyQuery.status === "loading" ? (
            <SectionLoading label="" />
          ) : historyQuery.status === "error" ? (
            <EmptyState title="Couldn't load history" className="py-8" />
          ) : history.length === 0 ? (
            <EmptyState title="No submissions yet" className="py-8" />
          ) : (
            <div className="space-y-2">
              {history.map((row) => {
                const open = expanded === row.id;
                return (
                  <div key={row.id} className="rounded-xl border border-wt-border bg-wt-surface-1">
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : row.id)}
                      aria-expanded={open}
                      className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-wt-text">{monthLabel(row.month)}</p>
                        <p className="text-xs text-wt-text-muted">{row.cycle_label}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Badge variant="outline">{REVIEW_STATUS_LABELS[row.review_status ?? ""] ?? row.review_status}</Badge>
                        {row.employee_rating_display ? (
                          <Badge variant="outline">Self {row.employee_rating_display.split(" - ")[0]}</Badge>
                        ) : null}
                        {row.manager_rating_display ? (
                          <Badge variant="outline">Manager {row.manager_rating_display.split(" - ")[0]}</Badge>
                        ) : null}
                        {row.final_score != null ? <Badge>Final {row.final_score}</Badge> : null}
                        {row.admin_edits?.length ? <Badge variant="outline">Edited by HR</Badge> : null}
                        <ChevronDown
                          className={cn("size-4 text-wt-text-faint transition-transform", open && "rotate-180")}
                        />
                      </div>
                    </button>
                    {open ? (
                      <div className="space-y-4 border-t border-wt-border px-4 py-4">
                        <RatingsComparison submission={row} />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <ReportNote title="Employee self review" text={row.self_review_text} />
                          <ReportNote
                            title={`Manager comments${row.manager_review?.reviewed_by ? ` · ${row.manager_review.reviewed_by}` : ""}`}
                            text={row.manager_evaluation?.comments || row.manager_review?.comments}
                          />
                        </div>
                        {row.admin_review?.comments ? (
                          <ReportNote title="HR decision" text={row.admin_review.comments} />
                        ) : null}
                        <div className="flex justify-end">
                          <Button type="button" size="sm" variant="outline" onClick={() => setReviewing(row)}>
                            Open Review
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {reviewing ? (
        <AdminReviewModal
          submission={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null);
            setReloadTick((t) => t + 1);
          }}
        />
      ) : null}
    </div>
  );
}

const REVIEW_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "With manager",
  NEEDS_REVIEW: "Back with employee",
  MANAGER_SUBMITTED: "Awaiting HR approval",
  NEEDS_MANAGER_REVIEW: "Back with manager",
  APPROVED: "Approved",
};

function fmt(value: number | null): string {
  return value == null ? "—" : value.toFixed(2);
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function ReportNote({ title, text }: { title: string; text?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold text-wt-text-muted">{title}</p>
      <p className="mt-1 whitespace-pre-wrap rounded-lg border border-wt-border bg-wt-surface-2/40 p-2.5 text-sm text-wt-text">
        {text?.trim() || "—"}
      </p>
    </div>
  );
}

type BreakdownItem = {
  key: string;
  label: string;
  meta: string;
  self: number | null;
  manager: number | null;
  count: number;
};

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Every KPI/value rated in any cycle, with the employee's and manager's
 *  average rating across those cycles. */
function perItemBreakdown(rows: MonthlySubmissionItem[]): BreakdownItem[] {
  const items = new Map<string, { label: string; meta: string; self: number[]; manager: number[]; cycles: Set<number> }>();
  const touch = (key: string, label: string, meta: string) => {
    let item = items.get(key);
    if (!item) {
      item = { label, meta, self: [], manager: [], cycles: new Set() };
      items.set(key, item);
    }
    return item;
  };
  for (const row of rows) {
    const selfKpi = new Map(row.kpi_ratings.map((r) => [r.kpi_id, r.rating]));
    const selfValue = new Map(row.value_ratings.map((r) => [r.value_id, r.rating]));
    for (const k of row.kpi_details) {
      const item = touch(`k${k.id}`, k.kpi_name, [k.parameter, "KPI"].filter(Boolean).join(" · "));
      const self = selfKpi.get(k.id);
      const mgr = row.manager_evaluation?.kpi_ratings[String(k.id)];
      if (self != null) item.self.push(self);
      if (mgr != null) item.manager.push(mgr);
      if (self != null || mgr != null) item.cycles.add(row.id);
    }
    for (const v of row.value_details) {
      const item = touch(`v${v.id}`, v.name, "Value");
      const self = selfValue.get(v.id);
      const mgr = row.manager_evaluation?.value_ratings[String(v.id)];
      if (self != null) item.self.push(self);
      if (mgr != null) item.manager.push(mgr);
      if (self != null || mgr != null) item.cycles.add(row.id);
    }
  }
  return Array.from(items.entries())
    .filter(([, i]) => i.cycles.size > 0)
    .map(([key, i]) => ({ key, label: i.label, meta: i.meta, self: avg(i.self), manager: avg(i.manager), count: i.cycles.size }));
}

/** One CSV row per (submission, KPI/value): both ratings side by side plus
 *  the submission's status and final score. */
function downloadEmployeeReport(employee: EmployeeSummary, rows: MonthlySubmissionItem[]) {
  const columns = [
    "Employee", "Emp ID", "Month", "Cycle", "Status", "Type", "Item", "Parameter", "Weight %",
    "Employee rating", "Manager rating", "Final score", "Manager comments", "HR edits",
  ];
  const out: Record<string, string>[] = [];
  for (const row of rows) {
    const base = {
      Employee: employee.name,
      "Emp ID": employee.emp_id ?? "",
      Month: row.month,
      Cycle: row.cycle_label,
      Status: REVIEW_STATUS_LABELS[row.review_status ?? ""] ?? row.review_status ?? "",
      "Final score": row.final_score != null ? String(row.final_score) : "",
      "Manager comments": row.manager_evaluation?.comments ?? "",
      "HR edits": String(row.admin_edits?.length ?? 0),
    };
    const selfKpi = new Map(row.kpi_ratings.map((r) => [r.kpi_id, r.rating]));
    const selfValue = new Map(row.value_ratings.map((r) => [r.value_id, r.rating]));
    for (const k of row.kpi_details) {
      out.push({
        ...base,
        Type: "KPI",
        Item: k.kpi_name,
        Parameter: k.parameter ?? "",
        "Weight %": String(k.weightage),
        "Employee rating": String(selfKpi.get(k.id) ?? ""),
        "Manager rating": String(row.manager_evaluation?.kpi_ratings[String(k.id)] ?? ""),
      });
    }
    for (const v of row.value_details) {
      out.push({
        ...base,
        Type: "Value",
        Item: v.name,
        Parameter: "",
        "Weight %": "",
        "Employee rating": String(selfValue.get(v.id) ?? ""),
        "Manager rating": String(row.manager_evaluation?.value_ratings[String(v.id)] ?? ""),
      });
    }
  }
  const slug = (employee.emp_id || employee.name).replace(/[^\w-]+/g, "_");
  downloadCsvFile(`kpi-report-${slug}.csv`, columns, out);
}
