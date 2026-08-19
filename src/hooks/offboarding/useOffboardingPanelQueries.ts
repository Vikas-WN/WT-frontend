"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showErrorToast } from "@/lib/toast";
import { hrmsService } from "@/services/hrms.service";
import type { HrOffboardListItem } from "@/types/offboard";
import { pickRowField } from "@/utils/compOff";
import { toPagedRows } from "@/utils/apiRows";
import { formatApiDate } from "@/utils/apiDate";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  isEligibleOffboardCandidateStatus,
  isServingNoticeUserStatus,
} from "@/utils/userStatus";
import { extractSkillNames } from "@/utils/employeeDirectory";

export type OffboardCandidate = {
  emp_id: string;
  name: string;
  email: string;
  user_type: string;
  band: string;
  status: string;
  primary_skills?: string[];
};

export const OFFBOARDING_LIST_PAGE_SIZE = 10;
export const OFFBOARDING_LIST_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const EMPTY_OFFBOARD_LIST: HrOffboardListItem[] = [];

const OFFBOARDING_LWD_WINDOW_DAYS = 60;

export function defaultOffboardingLwdWindow(): { from: string; to: string } {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - OFFBOARDING_LWD_WINDOW_DAYS);
  const to = new Date(today);
  to.setDate(to.getDate() + OFFBOARDING_LWD_WINDOW_DAYS);
  return { from: formatApiDate(from), to: formatApiDate(to) };
}

const OFFBOARDING_STALE_MS = 5 * 60_000;
const OFFBOARDING_LIST_STALE_MS = 30_000;

function defaultFinancialYearStart(): string {
  const now = new Date();
  const year = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  return String(year);
}

function parseFinancialYear(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed) && parsed >= 2000 && parsed <= 2100) {
    return parsed;
  }
  return null;
}

function exitSplitPercent(part: unknown, total: unknown): number {
  const p = Number(part);
  const t = Number(total);
  if (!Number.isFinite(p) || !Number.isFinite(t) || t <= 0) return 0;
  return Math.round((p / t) * 1000) / 10;
}

function parseOffboardListItem(row: Record<string, unknown>): HrOffboardListItem | null {
  const empId = String(pickRowField(row, "emp_id", "empId") ?? "").trim();
  if (!empId) return null;

  return {
    emp_id: empId,
    status: String(pickRowField(row, "status") ?? "").trim(),
    employee_name: String(pickRowField(row, "employee_name", "employeeName") ?? "").trim(),
    email: String(pickRowField(row, "email") ?? "").trim() || undefined,
    exit_type: String(
      pickRowField(row, "exit_type", "exitType", "separation_type", "separationType") ?? ""
    ).trim(),
    reason: (pickRowField(row, "reason") as string | null | undefined) ?? null,
    expected_behavior:
      (pickRowField(row, "expected_behavior", "expectedBehavior") as string | null | undefined) ??
      null,
    critical_skill:
      (pickRowField(row, "critical_skill", "criticalSkill") as string | null | undefined) ?? null,
    is_regretted: Boolean(pickRowField(row, "is_regretted", "isRegretted")),
    resignation_date: String(
      pickRowField(row, "resignation_date", "resignationDate") ?? ""
    ).trim(),
    last_working_day: String(
      pickRowField(row, "last_working_day", "lastWorkingDay") ?? ""
    ).trim(),
    notice_period_days: Number(pickRowField(row, "notice_period_days", "noticePeriodDays") ?? 0),
    designation: (pickRowField(row, "designation") as string | null | undefined) ?? null,
    band_name: (pickRowField(row, "band_name", "bandName") as string | null | undefined) ?? null,
    band_role: (pickRowField(row, "band_role", "bandRole") as string | null | undefined) ?? null,
    department: (pickRowField(row, "department") as string | null | undefined) ?? null,
    project_manager:
      (pickRowField(row, "project_manager", "projectManager") as string | null | undefined) ?? null,
    exit_survey_submitted: Boolean(
      pickRowField(row, "exit_survey_submitted", "exitSurveySubmitted")
    ),
    can_resend_exit_survey: Boolean(
      pickRowField(row, "can_resend_exit_survey", "canResendExitSurvey")
    ),
    submission_status: pickRowField(row, "submission_status", "submissionStatus") as
      | HrOffboardListItem["submission_status"]
      | undefined,
    lookup_id: String(pickRowField(row, "lookup_id", "lookupId") ?? "").trim() || undefined,
    can_view_submission: Boolean(
      pickRowField(row, "can_view_submission", "canViewSubmission")
    ),
  };
}

function parseOffboardListPayload(payload: unknown): { items: HrOffboardListItem[]; total: number } {
  const envelope =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const data =
    envelope.data && typeof envelope.data === "object"
      ? (envelope.data as Record<string, unknown>)
      : envelope;
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems
    .map((row) => parseOffboardListItem(row as Record<string, unknown>))
    .filter((row): row is HrOffboardListItem => Boolean(row));
  const totalRaw =
    data.total ??
    data.total_elements ??
    data.totalElements ??
    data.total_count ??
    data.totalCount ??
    items.length;
  const total = Number(totalRaw);
  return {
    items,
    total: Number.isFinite(total) ? total : items.length,
  };
}

function buildOffboardCandidates(
  onboardRows: Array<Record<string, unknown>>,
  offboardedItems: HrOffboardListItem[]
): OffboardCandidate[] {
  const offboardedIds = new Set(
    offboardedItems.map((row) => String(row.emp_id ?? "").trim().toLowerCase())
  );

  return Array.from(
    new Map(
      onboardRows
        .map((row) => {
          const emp_id = String(row.emp_id ?? row.empId ?? "").trim();
          if (!emp_id || offboardedIds.has(emp_id.toLowerCase())) return null;
          const status = String(row.status ?? "").trim().toUpperCase();
          if (!isEligibleOffboardCandidateStatus(status) || isServingNoticeUserStatus(status)) {
            return null;
          }
          const name = String(row.name ?? "—").trim() || "—";
          const email = String(row.email ?? "—").trim() || "—";
          const user_type = String(row.user_type ?? row.userType ?? "").trim().toUpperCase();
          const band =
            String(row.band ?? row.band_name ?? row.bandName ?? row.band_id ?? row.bandId ?? "")
              .trim() || "—";
          const rawSkills = row.primary_skills ?? row.primarySkills;
          const primary_skills = extractSkillNames(rawSkills);
          const candidate: OffboardCandidate = {
            emp_id,
            name,
            email,
            user_type,
            band,
            status,
            primary_skills,
          };
          return [emp_id.toLowerCase(), candidate] as const;
        })
        .filter((entry): entry is readonly [string, OffboardCandidate] => Boolean(entry))
    ).values()
  ).sort((a, b) => a.emp_id.localeCompare(b.emp_id));
}

export function useOffboardingPanelQueries() {
  const queryClient = useQueryClient();

  const [listPage, setListPage] = useState(0);
  const [listPageSize, setListPageSizeState] = useState(OFFBOARDING_LIST_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filterFromDate, setFilterFromDate] = useState(
    () => defaultOffboardingLwdWindow().from,
  );
  const [filterToDate, setFilterToDate] = useState(
    () => defaultOffboardingLwdWindow().to,
  );
  const [filterType, setFilterType] = useState("");
  const [fyStartYear, setFyStartYear] = useState(() => defaultFinancialYearStart());

  const listFilters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      type: filterType.trim() || undefined,
      fromDate: filterFromDate.trim() || undefined,
      toDate: filterToDate.trim() || undefined,
    }),
    [debouncedSearch, filterType, filterFromDate, filterToDate]
  );

  const listFiltersKey = useMemo(() => JSON.stringify(listFilters), [listFilters]);
  const prevListFiltersKey = useRef(listFiltersKey);

  useEffect(() => {
    if (prevListFiltersKey.current === listFiltersKey) return;
    prevListFiltersKey.current = listFiltersKey;
    setListPage(0);
  }, [listFiltersKey]);

  const setListPageSize = useCallback((size: number) => {
    const next = OFFBOARDING_LIST_PAGE_SIZE_OPTIONS.includes(
      size as (typeof OFFBOARDING_LIST_PAGE_SIZE_OPTIONS)[number]
    )
      ? size
      : OFFBOARDING_LIST_PAGE_SIZE;
    setListPageSizeState((current) => {
      if (current === next) return current;
      return next;
    });
    setListPage(0);
  }, []);

  const fyYear = useMemo(() => parseFinancialYear(fyStartYear), [fyStartYear]);

  const attritionQ = useQuery({
    queryKey: ["offboarding", "attrition", fyYear],
    queryFn: async () => {
      if (fyYear == null) {
        return {
          attritionPercent: null,
          attritionExitCount: null,
          voluntaryPercent: null,
          involuntaryPercent: null,
        };
      }
      const [overallResult, viResult] = await Promise.allSettled([
        hrmsService.getAttritionOverallPercent({ fy_start_year: fyYear }),
        hrmsService.getAttritionVoluntaryInvoluntary({ fy_start_year: fyYear }),
      ]);

      if (overallResult.status === "rejected" && viResult.status === "rejected") {
        const overallError = overallResult.reason;
        throw overallError instanceof Error
          ? overallError
          : new Error("Failed to load attrition metrics.");
      }

      const overall =
        overallResult.status === "fulfilled"
          ? (((overallResult.value as { data?: unknown }).data ?? {}) as Record<string, unknown>)
          : {};
      const vi =
        viResult.status === "fulfilled"
          ? (((viResult.value as { data?: unknown }).data ?? {}) as Record<string, unknown>)
          : {};
      const voluntaryCount = Number(vi.voluntary_count ?? 0);
      const involuntaryCount = Number(vi.involuntary_count ?? 0);
      const totalCount = Number(vi.total_count ?? voluntaryCount + involuntaryCount);

      return {
        attritionPercent: Number(overall.attrition_percent ?? 0),
        attritionExitCount: Number(overall.number_of_exits ?? totalCount),
        voluntaryPercent: exitSplitPercent(voluntaryCount, totalCount),
        involuntaryPercent: exitSplitPercent(involuntaryCount, totalCount),
      };
    },
    staleTime: OFFBOARDING_STALE_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const candidatesQ = useQuery({
    queryKey: ["offboarding", "candidates"],
    queryFn: async () => {
      const [onboardResult, offboardResult] = await Promise.allSettled([
        hrmsService.getOnboardList({ page: "0", size: "500" }),
        hrmsService.getOffboardList({ page: 0, size: 200 }),
      ]);

      if (onboardResult.status === "rejected") {
        throw onboardResult.reason instanceof Error
          ? onboardResult.reason
          : new Error("Failed to load employees for offboarding.");
      }

      const onboardRows = toPagedRows(
        (onboardResult.value as { data?: unknown }).data ?? onboardResult.value
      );
      const offboardedItems =
        offboardResult.status === "fulfilled"
          ? parseOffboardListPayload(offboardResult.value).items
          : [];
      return buildOffboardCandidates(onboardRows, offboardedItems);
    },
    staleTime: OFFBOARDING_STALE_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const listQ = useQuery({
    queryKey: ["offboarding", "list", listPage, listPageSize, listFilters],
    queryFn: async () => {
      const res = await hrmsService.getOffboardList({
        page: listPage,
        size: listPageSize,
        ...listFilters,
      });
      return parseOffboardListPayload(res);
    },
    staleTime: OFFBOARDING_LIST_STALE_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const refreshOffboardingData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["offboarding"] });
  }, [queryClient]);

  const updateFyStartYear = useCallback((value: string) => {
    setFyStartYear((current) => (current === value ? current : value));
  }, []);

  const updateFilterFromDate = useCallback((value: string) => {
    setFilterFromDate((current) => (current === value ? current : value));
  }, []);

  const updateFilterToDate = useCallback((value: string) => {
    setFilterToDate((current) => (current === value ? current : value));
  }, []);

  const updateFilterType = useCallback((value: string) => {
    setFilterType((current) => (current === value ? current : value));
  }, []);

  const offboardCandidates = candidatesQ.data ?? [];
  const offboardedRows = listQ.data?.items ?? EMPTY_OFFBOARD_LIST;
  const listTotal = listQ.data?.total ?? 0;
  const loadingAttrition = attritionQ.isLoading && !attritionQ.data;
  const loadingCandidates = candidatesQ.isLoading && !candidatesQ.data;
  const loadingList = listQ.isFetching;

  useEffect(() => {
    if (!listQ.isError) return;
    const error = listQ.error;
    const msg =
      error instanceof Error ? error.message : "Failed to load offboarded employees.";
    showErrorToast(msg);
  }, [listQ.isError, listQ.error]);

  useEffect(() => {
    if (!candidatesQ.isError) return;
    const error = candidatesQ.error;
    const msg =
      error instanceof Error ? error.message : "Failed to load employees for offboarding.";
    showErrorToast(msg);
  }, [candidatesQ.isError, candidatesQ.error]);

  useEffect(() => {
    if (!attritionQ.isError) return;
    const error = attritionQ.error;
    const msg =
      error instanceof Error ? error.message : "Failed to load attrition metrics.";
    showErrorToast(msg);
  }, [attritionQ.isError, attritionQ.error]);

  return {
    listPage,
    setListPage,
    listPageSize,
    setListPageSize,
    listPageSizeOptions: OFFBOARDING_LIST_PAGE_SIZE_OPTIONS,
    search,
    setSearch,
    filterFromDate,
    setFilterFromDate: updateFilterFromDate,
    filterToDate,
    setFilterToDate: updateFilterToDate,
    filterType,
    setFilterType: updateFilterType,
    fyStartYear,
    setFyStartYear: updateFyStartYear,
    offboardCandidates,
    offboardedRows,
    listTotal,
    loadingAttrition,
    loadingCandidates,
    loadingList,
    attritionPercent: attritionQ.data?.attritionPercent ?? null,
    voluntaryPercent: attritionQ.data?.voluntaryPercent ?? null,
    involuntaryPercent: attritionQ.data?.involuntaryPercent ?? null,
    attritionExitCount: attritionQ.data?.attritionExitCount ?? null,
    refreshOffboardingData,
    refetchList: listQ.refetch,
    listFetched: listQ.isFetched,
    financialYearOptions: FINANCIAL_YEAR_OPTIONS,
  };
}

export function financialYearSelectOptions() {
  return Array.from({ length: Math.max(new Date().getFullYear() - 2019 + 1, 1) }, (_, idx) => {
    const year = String(2019 + idx);
    return {
      value: year,
      label: `FY ${year}–${String(Number(year) + 1).slice(-2)}`,
    };
  });
}

const FINANCIAL_YEAR_OPTIONS = financialYearSelectOptions();
