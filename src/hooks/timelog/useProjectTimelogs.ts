"use client";

import { useQuery } from "@tanstack/react-query";
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

function entriesFromTimelogList(payload: unknown): DayTimelogEntry[] {
  const data = unwrapData(payload);
  if (Array.isArray(data)) return normalizeDayTimelogEntries(data);
  if (data && typeof data === "object") {
    const root = data as Record<string, unknown>;
    return normalizeDayTimelogEntries(
      root.items ?? root.entries ?? root.content ?? root.timelogs ?? data
    );
  }
  return normalizeDayTimelogEntries(data);
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

  for (const [startDate, endDate] of [
    [startDmy, endDmy],
    [startIso, endIso],
  ] as const) {
    try {
      const response = await hrmsService.getTimelogEmployeeEntries({
        employeeEmail: email,
        startDate,
        endDate,
        viewerRoles: roles,
      });
      const entries = normalizeDayTimelogEntries(unwrapData(response));
      if (entries.length) return entries;
    } catch {
      // try next
    }
  }

  try {
    const response = await hrmsService.getTimelogs({
      page: "0",
      size: "200",
      employeeEmail: email,
      employee_email: email,
      startDate: startDmy,
      start_date: startDmy,
      endDate: endDmy,
      end_date: endDmy,
    });
    return entriesFromTimelogList(response);
  } catch {
    return [];
  }
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

  try {
    const response = await hrmsService.getTimelogs({
      page: "0",
      size: "500",
      projectCode: code,
      project_code: code,
      startDate: range.startDmy,
      start_date: range.startDmy,
      endDate: range.endDmy,
      end_date: range.endDmy,
      status: "APPROVED",
    });
    const entries = filterEntriesToRange(
      entriesFromTimelogList(response),
      range.startIso,
      range.endIso
    );
    if (entries.length) {
      const byEmail = new Map<string, number>();
      for (const entry of entries) {
        if (!isApprovedStatus(entry.status)) continue;
        if (entry.project_code.trim().toUpperCase() !== code) continue;
        const email = entry.employee_email.trim().toLowerCase();
        const hours = Number(entry.hours);
        if (!email || !Number.isFinite(hours)) continue;
        byEmail.set(email, (byEmail.get(email) ?? 0) + hours);
      }
      return employees.map((emp) => ({
        email: emp.email,
        name: emp.name,
        week_total: byEmail.get(emp.email.trim().toLowerCase()) ?? 0,
      }));
    }
  } catch {
    // fall through to per-employee
  }

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

export function useProjectTimelogs(enabled: boolean) {
  const { user } = useAuth();
  const viewerRoles = useMemo(
    () => timelogViewerRoles(user?.roles ?? []),
    [user?.roles]
  );

  const [fromDate, setFromDateState] = useState("");
  const [toDate, setToDateState] = useState("");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const filterRange = useMemo(() => rangeFromDates(fromDate, toDate), [fromDate, toDate]);
  const hasDateFilter = filterRange != null;
  const activeRange = filterRange ?? fullDataRange();
  const rangeKey = hasDateFilter
    ? `${activeRange.startIso}:${activeRange.endIso}`
    : "all";

  const projectsQuery = useQuery({
    queryKey: ["project-timelogs-projects"],
    enabled,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await hrmsService.getTimelogProjects();
      return normalizeProjectTimelogsData(unwrapData(response));
    },
  });

  const projects: ProjectTimelogProject[] = useMemo(
    () => projectsQuery.data?.projects ?? [],
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
    staleTime: 15_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
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
    staleTime: 15_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
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
      return { mode: "all" as const, entries: filtered, snapshot: null };
    },
  });

  const employeeEntries: DayTimelogEntry[] = useMemo(
    () => employeeDetailQuery.data?.entries ?? [],
    [employeeDetailQuery.data]
  );

  const toggleProject = useCallback((code: string) => {
    setExpandedProject((prev) => (prev === code ? null : code));
    setSelectedEmployee(null);
  }, []);

  const selectEmployee = useCallback((email: string | null) => {
    setSelectedEmployee(email ? email.trim().toLowerCase() : null);
  }, []);

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
    projectsLoading: projectsQuery.isLoading,
    projectsError: projectsQuery.error
      ? projectsQuery.error instanceof Error
        ? projectsQuery.error.message
        : "Failed to load projects"
      : null,
    weekTotals,
    weekTotalsLoading: approvedTotalsQuery.isLoading || approvedTotalsQuery.isFetching,
    expandedProject,
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
