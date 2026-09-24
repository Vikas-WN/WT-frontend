"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { hrmsService } from "@/services/hrms.service";
import { formatApiDate as formatApiDateDmy, parseApiDate } from "@/utils/apiDate";
import { formatApiDate as formatIsoDate, toIsoDateKey } from "@/utils/timelog/weekDates";
import { normalizeProjectTimelogsData } from "@/utils/timelog/normalizeProjectTimelogs";
import { normalizeDayTimelogEntries } from "@/utils/timelog/normalizeWeekSnapshot";
import { timelogViewerRoles } from "@/utils/timelog/viewerRoles";
import type { DayTimelogEntry } from "@/hooks/timelog/useDayTimelog.types";
import type {
  ProjectTimelogProject,
  ProjectWeekEmployeeTotal,
} from "./useProjectTimelogs.types";

function unwrapData(response: unknown): unknown {
  if (!response || typeof response !== "object") return response;
  const root = response as Record<string, unknown>;
  if ("data" in root && root.data != null) return root.data;
  return response;
}

function fullDataRange(): { startDmy: string; endDmy: string; startIso: string; endIso: string } {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setMonth(start.getMonth() - 6);
  return {
    startDmy: formatApiDateDmy(start),
    endDmy: formatApiDateDmy(end),
    startIso: formatIsoDate(start),
    endIso: formatIsoDate(end),
  };
}

function rangeFromDates(
  fromDate: string,
  toDate: string
): { startDmy: string; endDmy: string; startIso: string; endIso: string } | null {
  const from = parseApiDate(fromDate);
  const to = parseApiDate(toDate);
  if (!from || !to) return null;
  if (from.getTime() > to.getTime()) return null;
  return {
    startDmy: formatApiDateDmy(from),
    endDmy: formatApiDateDmy(to),
    startIso: formatIsoDate(from),
    endIso: formatIsoDate(to),
  };
}

async function fetchEmployeeEntriesRange(params: {
  email: string;
  startDmy: string;
  endDmy: string;
  startIso: string;
  endIso: string;
  viewerRoles: string[];
}): Promise<DayTimelogEntry[]> {
  const { email, startDmy, endDmy, startIso, endIso, viewerRoles } = params;
  const roles = viewerRoles.length ? viewerRoles : undefined;
  const batches: DayTimelogEntry[][] = [];
  let lastError: unknown = null;

  // Only use the manager employee-entries API — never fall back to GET /timelog
  // (that returns the actor's own logs and hides pending employee submissions).
  for (const [startDate, endDate] of [
    [startIso, endIso],
    [startDmy, endDmy],
  ] as const) {
    try {
      const response = await hrmsService.getTimelogEmployeeEntries({
        employeeEmail: email,
        startDate,
        endDate,
        viewerRoles: roles,
      });
      const entries = normalizeDayTimelogEntries(unwrapData(response));
      batches.push(entries);
      if (entries.length) break;
    } catch (error) {
      lastError = error;
    }
  }

  if (batches.length) return mergeTimelogEntries(...batches);
  if (lastError) throw lastError;
  return [];
}

function filterEntriesToRange(
  entries: DayTimelogEntry[],
  startIso: string,
  endIso: string
): DayTimelogEntry[] {
  return entries.filter((entry) => {
    const key = toIsoDateKey(entry.log_date);
    return key >= startIso && key <= endIso;
  });
}

function entryDedupeKey(entry: DayTimelogEntry): string {
  if (entry.id > 0) return `id:${entry.id}`;
  return [
    entry.employee_email,
    entry.project_code,
    entry.task_category,
    entry.sub_category ?? "",
    toIsoDateKey(entry.log_date),
    String(entry.hours),
    entry.status,
  ].join("|");
}

function mergeTimelogEntries(...groups: DayTimelogEntry[][]): DayTimelogEntry[] {
  const byKey = new Map<string, DayTimelogEntry>();
  for (const group of groups) {
    for (const entry of group) {
      byKey.set(entryDedupeKey(entry), entry);
    }
  }
  return sortTimelogEntriesByDateDesc(Array.from(byKey.values()));
}

function sortTimelogEntriesByDateDesc(entries: DayTimelogEntry[]): DayTimelogEntry[] {
  return [...entries].sort((a, b) => {
    const aDate = parseApiDate(toIsoDateKey(a.log_date));
    const bDate = parseApiDate(toIsoDateKey(b.log_date));
    const aTime = aDate?.getTime() ?? 0;
    const bTime = bDate?.getTime() ?? 0;
    if (aTime !== bTime) return bTime - aTime;
    return b.id - a.id;
  });
}

function isApprovedStatus(status: string | null | undefined): boolean {
  return String(status ?? "").trim().toUpperCase() === "APPROVED";
}

function sumApprovedHoursForProject(
  entries: DayTimelogEntry[],
  projectCode: string
): number {
  const code = projectCode.trim().toUpperCase();
  return entries.reduce((sum, entry) => {
    if (!isApprovedStatus(entry.status)) return sum;
    if (entry.project_code.trim().toUpperCase() !== code) return sum;
    const hours = Number(entry.hours);
    return sum + (Number.isFinite(hours) ? hours : 0);
  }, 0);
}

async function fetchProjectApprovedTotals(params: {
  projectCode: string;
  employees: Array<{ email: string; name: string }>;
  range: { startDmy: string; endDmy: string; startIso: string; endIso: string };
  viewerRoles: string[];
}): Promise<ProjectWeekEmployeeTotal[]> {
  const { projectCode, employees, range, viewerRoles } = params;
  const code = projectCode.trim().toUpperCase();

  // Use the same merged entry fetch as employee detail so approved hours stay in sync.
  return Promise.all(
    employees.map(async (emp) => {
      const entries = await fetchEmployeeEntriesRange({
        email: emp.email,
        ...range,
        viewerRoles,
      });
      const inRange = filterEntriesToRange(entries, range.startIso, range.endIso);
      return {
        email: emp.email,
        name: emp.name,
        week_total: sumApprovedHoursForProject(inRange, code),
      };
    })
  );
}

const DEEP_LINK_PARAMS = ["employee", "from", "to", "project"] as const;

function readDeepLink(searchParams: URLSearchParams | { get(name: string): string | null }) {
  const employee = (searchParams.get("employee") ?? "").trim().toLowerCase() || null;
  const project = (searchParams.get("project") ?? "").trim().toUpperCase() || null;
  const range = rangeFromDates(searchParams.get("from") ?? "", searchParams.get("to") ?? "");
  const key = [employee ?? "", range?.startIso ?? "", range?.endIso ?? "", project ?? ""].join("|");
  return { employee, project, range, key };
}

export function useProjectTimelogs(enabled: boolean) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewerRoles = useMemo(
    () => timelogViewerRoles(user?.roles ?? []),
    [user?.roles]
  );

  // Deep link from a "Timelog submitted" notification:
  //   ?employee=<email>&from=<dd/mm/yyyy>&to=<dd/mm/yyyy>[&project=<CODE>]
  // (built by the backend — app/domain/timelog_links.py — and stored on the
  // notification). It opens that employee's submitted entries for exactly those
  // dates / that project. Applied whenever the link changes — not only on first
  // mount — so clicking a notification while already on this page works too.
  const link = readDeepLink(searchParams);
  const [appliedLinkKey, setAppliedLinkKey] = useState<string | null>(null);
  const [fromDate, setFromDateState] = useState(() => link.range?.startDmy ?? fullDataRange().startDmy);
  const [toDate, setToDateState] = useState(() => link.range?.endDmy ?? fullDataRange().endDmy);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  // Project the deep link is about. Kept separate from the accordion's
  // `expandedProject`, which collapses when that project isn't on the current
  // page of the list (and would clear the employee along with it).
  const [focusProject, setFocusProject] = useState<string | null>(null);

  if (enabled && link.employee && link.key !== appliedLinkKey) {
    // "Adjust state while rendering" — React's recommended way to react to a
    // changed input without an effect.
    setAppliedLinkKey(link.key);
    setSelectedEmployee(link.employee);
    setFocusProject(link.project);
    if (link.range) {
      setFromDateState(link.range.startDmy);
      setToDateState(link.range.endDmy);
    }
  }

  const filterRange = useMemo(() => rangeFromDates(fromDate, toDate), [fromDate, toDate]);
  const hasDateFilter = filterRange != null;
  const activeRange = filterRange ?? fullDataRange();
  const rangeKey = hasDateFilter
    ? `${activeRange.startIso}:${activeRange.endIso}`
    : "all";

  const projectsQuery = useQuery({
    queryKey: ["project-timelogs-projects"],
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const response = await hrmsService.getTimelogProjects();
      return normalizeProjectTimelogsData(unwrapData(response));
    },
  });

  const projects: ProjectTimelogProject[] = useMemo(
    () => projectsQuery.data?.projects ?? [],
    [projectsQuery.data]
  );

  const pendingApprovals = useMemo(
    () => projectsQuery.data?.pendingApprovals ?? [],
    [projectsQuery.data]
  );

  const expandedEmployees = useMemo(() => {
    if (!expandedProject) return [];
    const code = expandedProject.trim().toUpperCase();
    const project = projects.find((p) => p.project_code.trim().toUpperCase() === code);
    return project?.employees ?? [];
  }, [projects, expandedProject]);

  const approvedTotalsQuery = useQuery({
    queryKey: [
      "project-timelogs-approved-totals",
      expandedProject,
      rangeKey,
      expandedEmployees.map((e) => e.email).join(","),
      viewerRoles.join(","),
    ],
    enabled: enabled && !!expandedProject && expandedEmployees.length > 0,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async () =>
      fetchProjectApprovedTotals({
        projectCode: expandedProject!,
        employees: expandedEmployees,
        range: activeRange,
        viewerRoles,
      }),
  });

  const weekTotals: Record<string, ProjectWeekEmployeeTotal[]> = useMemo(() => {
    if (!expandedProject || !approvedTotalsQuery.data) return {};
    return { [expandedProject]: approvedTotalsQuery.data };
  }, [expandedProject, approvedTotalsQuery.data]);

  const employeeDetailQuery = useQuery({
    queryKey: [
      "project-timelogs-employee-detail",
      selectedEmployee,
      rangeKey,
      viewerRoles.join(","),
    ],
    enabled: enabled && !!selectedEmployee,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
    queryFn: async () => {
      const email = selectedEmployee!.trim().toLowerCase();
      const entries = await fetchEmployeeEntriesRange({
        email,
        ...activeRange,
        viewerRoles,
      });
      const filtered = hasDateFilter
        ? filterEntriesToRange(entries, activeRange.startIso, activeRange.endIso)
        : entries;
      return { mode: "all" as const, entries: sortTimelogEntriesByDateDesc(filtered), snapshot: null };
    },
  });

  const employeeEntries: DayTimelogEntry[] = useMemo(
    () => employeeDetailQuery.data?.entries ?? [],
    [employeeDetailQuery.data]
  );

  const clearDeepLinkParams = useCallback(() => {
    if (!DEEP_LINK_PARAMS.some((key) => searchParams.has(key))) return;
    const next = new URLSearchParams(searchParams.toString());
    for (const key of DEEP_LINK_PARAMS) next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const selectEmployee = useCallback(
    (email: string | null) => {
      const next = email ? email.trim().toLowerCase() : null;
      setSelectedEmployee(next);
      if (!next) {
        // Leaving the linked view: drop the link so the same notification can
        // be opened again later, and stop filtering to its project.
        setFocusProject(null);
        setAppliedLinkKey(null);
        clearDeepLinkParams();
      }
    },
    [clearDeepLinkParams]
  );

  const toggleProject = useCallback(
    (code: string) => {
      setExpandedProject((prev) => (prev === code ? null : code));
      selectEmployee(null);
    },
    [selectEmployee]
  );

  const setFromDate = useCallback((value: string) => {
    setFromDateState(value);
  }, []);

  const setToDate = useCallback((value: string) => {
    setToDateState(value);
  }, []);

  const reload = useCallback(() => {
    void projectsQuery.refetch();
    if (expandedProject) void approvedTotalsQuery.refetch();
    if (selectedEmployee) void employeeDetailQuery.refetch();
  }, [
    projectsQuery,
    approvedTotalsQuery,
    employeeDetailQuery,
    expandedProject,
    selectedEmployee,
  ]);

  return {
    projects,
    pendingApprovals,
    projectsLoading: projectsQuery.isLoading,
    projectsError: projectsQuery.error
      ? projectsQuery.error instanceof Error
        ? projectsQuery.error.message
        : "Failed to load projects"
      : null,
    weekTotals,
    weekTotalsLoading: approvedTotalsQuery.isLoading || approvedTotalsQuery.isFetching,
    expandedProject,
    focusProject,
    selectedEmployee,
    fromDate,
    toDate,
    hasDateFilter,
    employeeEntries,
    employeeWeekLoading: employeeDetailQuery.isLoading || employeeDetailQuery.isFetching,
    employeeWeekError: employeeDetailQuery.error
      ? employeeDetailQuery.error instanceof Error
        ? employeeDetailQuery.error.message
        : "Failed to load employee time logs"
      : null,
    setFromDate,
    setToDate,
    toggleProject,
    selectEmployee,
    reload,
  };
}
