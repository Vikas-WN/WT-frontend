"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WT_STICKY_TABLE_HEAD_CLASS,
  WtTable,
  TableCheckbox,
} from "@/components/dashboard/ui/wtTable";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { ApiError } from "@/api/error";
import { hrmsService } from "@/services/hrms.service";
import { exitInterviewService } from "@/services/exitInterview.service";
import type { ExitSurveyBulkResendItemResult } from "@/types/exit-interview";
import {
  DatePickerField,
  DropdownSelectField,
  TextAreaField,
} from "@/components/dashboard/ui/forms";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { EmployeeStatusBadge } from "@/components/employee-directory/EmployeeStatusBadge";
import { ManagementListCard } from "@/components/dashboard/ui/ManagementListCard";
import { SearchInput } from "@/components/dashboard/ui/SearchInput";
import { FormGridSkeleton, MetricCardsSkeleton, TableRowsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { WtLoader } from "@/components/dashboard/ui/WtLoader";
import {
  CARD_CONTENT_STACK_CLASS,
  CARD_FORM_ACTIONS_CLASS,
  CARD_FORM_GRID_CLASS,
  CARD_STACK_CLASS,
  TABLE_ROW_SELECTED_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatApiDateDisplay } from "@/utils/apiDate";
import {
  useOffboardingPanelQueries,
} from "@/hooks/offboarding/useOffboardingPanelQueries";
import { useEmployeeProfile } from "@/hooks/employee-directory/useEmployeeProfile";
import { normalizeDirectoryUserType } from "@/utils/userTypeTransition";
import {
  CONSULTANT_EXIT_TYPE,
  createEmptyOffboardingForm,
  calculateNoticePeriodDays,
  defaultLastWorkingDayFromResignation,
  EXIT_TYPE_OPTIONS,
  formatExitTypeLabel,
  formatUserTypeLabel,
  isLwdOnlyOffboarding,
  isOffboardingFormValid,
  previousWeekdayOrSame,
  type ExitType,
} from "@/utils/offboardingFormState";
import {
  exitSurveySubmissionDetailHref,
  isResendableOffboardListRow,
  mergeEmpIdSelection,
  resendableOffboardEmpIds,
} from "@/utils/exitSurveyFollowUp";
import { normalizeEmployeeStatusKey } from "@/utils/userStatus";
import { extractSkillNames } from "@/utils/employeeDirectory";

const USER_TYPE_FILTER_OPTIONS = ["", "FULLTIME", "INTERN", "CONSULTANT"] as const;

const INNER_SCROLL_CLASS =
  "wt-scroll-both max-h-[min(70vh,560px)] overflow-auto overscroll-behavior-auto rounded-xl border border-wt-border";

function formatPercent(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n}%`;
}

function formatBool(value: boolean): string {
  return value ? "Yes" : "No";
}

function bulkResendResultClassName(
  status: ExitSurveyBulkResendItemResult["status"]
): string {
  if (status === "SENT") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
  }
  if (status === "FAILED") {
    return "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200";
  }
  return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
}

export function OffboardingPanel() {
  const router = useRouter();
  // `createEmptyOffboardingForm` is a factory; store the actual form object in state.
  const [offboardingForm, setOffboardingForm] = useState(() => createEmptyOffboardingForm());
  const {
    listPage,
    setListPage,
    listPageSize,
    setListPageSize,
    listPageSizeOptions,
    search,
    setSearch,
    filterFromDate,
    setFilterFromDate,
    filterToDate,
    setFilterToDate,
    filterType,
    setFilterType,
    fyStartYear,
    setFyStartYear,
    offboardCandidates,
    offboardedRows,
    listTotal,
    loadingAttrition,
    loadingCandidates,
    loadingList,
    attritionPercent,
    voluntaryPercent,
    involuntaryPercent,
    attritionExitCount,
    refreshOffboardingData,
    listFetched,
    financialYearOptions,
  resetListFilters,
  } = useOffboardingPanelQueries();
  const [listCache, setListCache] = useState<{
    loaded: boolean;
    rows: typeof offboardedRows;
    total: number;
  }>({ loaded: false, rows: [], total: 0 });

  useEffect(() => {
    if (!listFetched) return;
    setListCache((prev) => {
      if (
        prev.loaded &&
        prev.total === listTotal &&
        prev.rows.length === offboardedRows.length &&
        prev.rows.every((row, index) => row.emp_id === offboardedRows[index]?.emp_id)
      ) {
        return prev;
      }
      return { loaded: true, rows: offboardedRows, total: listTotal };
    });
  }, [listFetched, offboardedRows, listTotal]);

  const displayRows = loadingList && !offboardedRows.length ? listCache.rows : offboardedRows;
  const displayTotal = loadingList && !offboardedRows.length ? listCache.total : listTotal;

  const [submitting, setSubmitting] = useState(false);
  const [resendingEmpId, setResendingEmpId] = useState<string | null>(null);
  const [bulkResending, setBulkResending] = useState(false);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [bulkResendResults, setBulkResendResults] = useState<ExitSurveyBulkResendItemResult[]>(
    []
  );

  const selectedCandidate = useMemo(
    () => offboardCandidates.find((row) => row.emp_id === offboardingForm.emp_id) ?? null,
    [offboardCandidates, offboardingForm.emp_id]
  );

  // Prefer live profile user_type so FULLTIME → CONSULTANT transitions aren't masked by
  // a stale offboarding candidates cache. Ignore profile payloads that belong to another emp.
  const selectedEmpId = offboardingForm.emp_id.trim();
  const selectedProfileQ = useEmployeeProfile(selectedEmpId, {
    enabled: Boolean(selectedEmpId),
  });
  const selectedUserType = useMemo(() => {
    const fromCandidate = normalizeDirectoryUserType(selectedCandidate?.user_type);
    const profileEmpId = String(
      selectedProfileQ.data?.emp_id ?? selectedProfileQ.data?.empId ?? ""
    ).trim();
    const profileMatchesSelected =
      Boolean(selectedEmpId) &&
      Boolean(profileEmpId) &&
      profileEmpId.toLowerCase() === selectedEmpId.toLowerCase();
    const fromProfile = profileMatchesSelected
      ? normalizeDirectoryUserType(
          selectedProfileQ.data?.user_type ?? selectedProfileQ.data?.userType
        )
      : "";
    if (fromProfile) return fromProfile;
    return fromCandidate;
  }, [selectedEmpId, selectedProfileQ.data, selectedCandidate?.user_type]);
  const isInternOffboarding = selectedUserType === "INTERN";
  const isConsultantOffboarding = selectedUserType === "CONSULTANT";
  const isInvitedOffboarding =
    normalizeEmployeeStatusKey(selectedCandidate?.status) === "INVITED";

  // Until the live profile resolves, selectedUserType falls back to the cached candidate
  // row, which can still say FULLTIME after a switch to CONSULTANT. Hold submission so HR
  // cannot commit Full-Time fields against the new user type.
  const userTypeStillResolving = Boolean(selectedEmpId) && selectedProfileQ.isLoading;
  const canSubmit =
    isOffboardingFormValid(offboardingForm, selectedUserType) && !userTypeStillResolving;

  // When live type resolves (or candidates refresh), drop Full-Time-only fields for consultants.
  useEffect(() => {
    if (!selectedEmpId || !selectedUserType) return;
    setOffboardingForm((prev) => {
      if (prev.emp_id.trim() !== selectedEmpId) return prev;
      if (selectedUserType === "CONSULTANT") {
        if (prev.exit_type === CONSULTANT_EXIT_TYPE && !prev.resignation_date.trim()) {
          return prev;
        }
        return {
          ...prev,
          resignation_date: "",
          exit_type: CONSULTANT_EXIT_TYPE,
        };
      }
      if (selectedUserType === "INTERN") {
        // Interns exit on a last working day only — they have no resignation date.
        if (!prev.resignation_date.trim()) return prev;
        return { ...prev, resignation_date: "" };
      }
      if (prev.exit_type === CONSULTANT_EXIT_TYPE) {
        return { ...prev, exit_type: "" };
      }
      return prev;
    });
  }, [selectedEmpId, selectedUserType]);

  useEffect(() => {
    setSelectedEmpIds([]);
    setBulkResendResults([]);
  }, [search, filterType, filterFromDate, filterToDate, listPage]);

  function handleListPageSizeChange(size: number) {
    setSelectedEmpIds([]);
    setBulkResendResults([]);
    setListPageSize(size);
  }

  const resendableEmpIdsOnPage = useMemo(
    () => resendableOffboardEmpIds(offboardedRows),
    [offboardedRows]
  );

  const selectedResendableCount = selectedEmpIds.length;
  const allResendableOnPageSelected =
    resendableEmpIdsOnPage.length > 0 &&
    resendableEmpIdsOnPage.every((empId) => selectedEmpIds.includes(empId));
  const someResendableOnPageSelected =
    resendableEmpIdsOnPage.some((empId) => selectedEmpIds.includes(empId)) &&
    !allResendableOnPageSelected;

  function toggleRowSelection(empId: string, checked: boolean) {
    const normalized = empId.trim();
    if (!normalized) return;
    setSelectedEmpIds((prev) => {
      if (checked) {
        return mergeEmpIdSelection(prev, [normalized]);
      }
      return prev.filter((id) => id !== normalized);
    });
  }

  function toggleSelectAllOnPage(checked: boolean) {
    if (!checked) {
      setSelectedEmpIds((prev) =>
        prev.filter((empId) => !resendableEmpIdsOnPage.includes(empId))
      );
      return;
    }
    setSelectedEmpIds((prev) => mergeEmpIdSelection(prev, resendableEmpIdsOnPage));
  }

  async function handleResendExitSurvey(empId: string, employeeEmail?: string) {
    const normalized = empId.trim();
    if (!normalized) return;
    setResendingEmpId(normalized);
    let successMessage: string | null = null;
    let errorMessage: string | null = null;
    try {
      const res = await exitInterviewService.resendSurvey(normalized);
      const email = employeeEmail?.trim() || res.data?.email?.trim();
      successMessage =
        res.data?.message?.trim() ||
        (email
          ? `Exit survey reminder sent to ${email}.`
          : "Exit survey reminder sent successfully.");
    } catch (error) {
      errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to resend exit survey.";
    } finally {
      setResendingEmpId(null);
    }
    if (successMessage) {
      showSuccessToast(successMessage);
    } else if (errorMessage) {
      showErrorToast(errorMessage);
    }
  }

  async function handleBulkResendExitSurvey() {
    if (!selectedEmpIds.length || bulkResending) return;
    setBulkResending(true);
    let resultSummary: string | null = null;
    let resultIsError = false;
    let errorMessage: string | null = null;
    try {
      const res = await exitInterviewService.resendSurveyBulk(selectedEmpIds);
      const data = res.data;
      const summary =
        res.message?.trim() ||
        `Exit survey reminders processed: ${data?.sent_count ?? 0} sent, ${data?.skipped_count ?? 0} skipped${
          data?.failed_count ? `, ${data.failed_count} failed` : ""
        }.`;
      resultSummary = summary;
      resultIsError =
        (data?.failed_count ?? 0) > 0 ||
        (data?.sent_count ?? 0) === 0;
      setSelectedEmpIds([]);
      setBulkResendResults(data?.results ?? []);
    } catch (error) {
      errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to resend exit surveys.";
    } finally {
      setBulkResending(false);
    }
    if (resultSummary) {
      if (resultIsError) showErrorToast(resultSummary);
      else showSuccessToast(resultSummary);
    } else if (errorMessage) {
      showErrorToast(errorMessage);
    }
  }


  const totalPages = Math.max(1, Math.ceil(displayTotal / listPageSize) || 1);
  const rangeStart = displayTotal === 0 ? 0 : listPage * listPageSize + 1;
  const rangeEnd = Math.min(displayTotal, (listPage + 1) * listPageSize);
  const showListPagination = displayTotal > 0;

  const candidateOptions = useMemo(
    () =>
      offboardCandidates.map((emp) => {
        const name = String(emp.name ?? "").trim() || String(emp.email ?? "").trim() || "Employee";
        const email = String(emp.email ?? "").trim();
        const label = email && name !== email ? `${name} (${email})` : name;
        return {
          value: emp.emp_id,
          label: label.length > 50 ? `${label.slice(0, 50)}…` : label,
        };
      }),
    [offboardCandidates]
  );

  const offboardingNoticeLabel = useMemo(() => {
    const r = offboardingForm.resignation_date.trim();
    const l = offboardingForm.last_working_day.trim();
    if (isInternOffboarding) {
      return "Intern offboarding records a last working day only — interns have no resignation date or notice period.";
    }
    if (isConsultantOffboarding) {
      return "Consultant offboarding is recorded as a Contractual exit and is excluded from attrition metrics.";
    }
    if (!r || !l) {
      return null;
    }
    const a = new Date(r);
    const b = new Date(l);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) {
      return "Resignation date must be on or before last working day.";
    }
    return null;
  }, [
    offboardingForm.resignation_date,
    offboardingForm.last_working_day,
    isInternOffboarding,
    isConsultantOffboarding,
  ]);

  function resolveExitTypeForSubmit(): ExitType {
    if (isConsultantOffboarding) return CONSULTANT_EXIT_TYPE;
    return offboardingForm.exit_type as ExitType;
  }

  function handleEmployeeChange(empId: string) {
    const candidate = offboardCandidates.find((row) => row.emp_id === empId);
    const type = normalizeDirectoryUserType(candidate?.user_type);
    const isIntern = type === "INTERN";
    const isConsultant = type === "CONSULTANT";
    const skills = extractSkillNames(candidate?.primary_skills).join(", ");
    setOffboardingForm((prev) => {
      const next = {
        ...createEmptyOffboardingForm(),
        emp_id: empId,
        exit_type: (isConsultant ? CONSULTANT_EXIT_TYPE : "") as "" | ExitType,
        critical_skill: skills,
      };
      if (isIntern && prev.last_working_day.trim()) {
        next.last_working_day = prev.last_working_day;
      }
      return next;
    });
  }

  function handleLastWorkingDayChange(value: string) {
    const adjusted = previousWeekdayOrSame(value);
    setOffboardingForm((prev) => ({
      ...prev,
      last_working_day: adjusted,
    }));
  }

  async function submitOffboarding() {
    if (!canSubmit) return;

    const empIdValue = offboardingForm.emp_id.trim();
    const resignationDate = offboardingForm.resignation_date.trim();
    const lastWorkingDay = offboardingForm.last_working_day.trim();

    setSubmitting(true);
    try {
      await hrmsService.offboardEmployee(empIdValue, {
        ...(isConsultantOffboarding || isInternOffboarding
          ? {}
          : { resignation_date: resignationDate }),
        exit_type: resolveExitTypeForSubmit(),
        last_working_day: lastWorkingDay || undefined,
        reason: offboardingForm.reason.trim() || null,
        expected_behavior: offboardingForm.expected_behavior.trim() || null,
        critical_skill: offboardingForm.critical_skill.trim() || null,
        is_regretted: offboardingForm.is_regretted,
      });
      setOffboardingForm(createEmptyOffboardingForm());
      setListPage(0);
      resetListFilters();
      showSuccessToast("Employee offboarded successfully.");
      await refreshOffboardingData();
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to submit offboarding.";
      showErrorToast(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={CARD_STACK_CLASS}>
      <Card className="p-0">
        <CardHeader className="flex-row items-end justify-between gap-3 space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle>Attrition Summary</CardTitle>
            <CardDescription>
              Financial-year exit metrics (Apr–Mar). Contractual exits are excluded.
              {attritionExitCount != null && !loadingAttrition
                ? ` · ${attritionExitCount} exit(s)`
                : ""}
            </CardDescription>
          </div>
          <DropdownSelectField
            label="Financial Year (Start)"
            className="w-[13.5rem] shrink-0"
            contentClassName="min-w-[min(13.5rem,calc(100vw-1rem))] w-max max-w-[min(var(--available-width,100vw),calc(100vw-1rem))]"
            value={fyStartYear}
            onChange={setFyStartYear}
            options={financialYearOptions}
          />
        </CardHeader>
        <Separator />
        <CardContent>
          {loadingAttrition ? (
            <MetricCardsSkeleton count={3} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-xl border border-wt-border bg-wt-surface-2/60 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-wt-text-muted">
                  Attrition %
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-rose-700">
                  {formatPercent(attritionPercent)}
                </p>
              </article>
              <article className="rounded-xl border border-wt-border bg-wt-surface-2/60 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-wt-text-muted">
                  Voluntary %
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--wt-brand)]">
                  {formatPercent(voluntaryPercent)}
                </p>
                <p className="mt-1 text-xs text-wt-text-muted">Share of FY exits</p>
              </article>
              <article className="rounded-xl border border-wt-border bg-wt-surface-2/60 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-wt-text-muted">
                  Involuntary %
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-700">
                  {formatPercent(involuntaryPercent)}
                </p>
                <p className="mt-1 text-xs text-wt-text-muted">Share of FY exits</p>
              </article>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>Employee Offboarding</CardTitle>
          <CardDescription>
            Record resignation details and submit offboarding for an active or invited employee.
            Active employees enter serving notice and receive the exit survey; invited employees are
            offboarded directly without an exit survey.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>
          {loadingCandidates && !offboardCandidates.length ? (
            <FormGridSkeleton fields={8} />
          ) : (
            <div className={CARD_CONTENT_STACK_CLASS}>
            <div className={CARD_FORM_GRID_CLASS}>
              <DropdownSelectField
                label="Employee"
                required
                disabled={loadingCandidates || submitting}
                placeholder={
                  candidateOptions.length ? "Select Employee" : "No Eligible Employees Available"
                }
                value={offboardingForm.emp_id}
                onChange={handleEmployeeChange}
                options={candidateOptions}
              />
              {!selectedCandidate ? null : isInternOffboarding ? (
                <DatePickerField
                  label="Last Working Day"
                  required
                  value={offboardingForm.last_working_day}
                  onChange={handleLastWorkingDayChange}
                  disabled={submitting}
                />
              ) : isConsultantOffboarding ? (
                <DatePickerField
                  label="Last Working Day"
                  required
                  value={offboardingForm.last_working_day}
                  onChange={handleLastWorkingDayChange}
                  disabled={submitting}
                />
              ) : (
                <>
                  <DatePickerField
                    label="Resignation Date"
                    required
                    value={offboardingForm.resignation_date}
                    onChange={(v) =>
                      setOffboardingForm((p) => ({
                        ...p,
                        resignation_date: v,
                        last_working_day: v.trim()
                          ? defaultLastWorkingDayFromResignation(v)
                          : "",
                      }))
                    }
                    disabled={submitting}
                  />
                  <DatePickerField
                    label="Last Working Day"
                    required
                    value={offboardingForm.last_working_day}
                    onChange={handleLastWorkingDayChange}
                    disabled={submitting}
                  />
                </>
              )}
              {!selectedCandidate ? null : isConsultantOffboarding ? null : (
                <DropdownSelectField
                  label="Exit Type"
                  required
                  placeholder="Select Exit Type"
                  value={offboardingForm.exit_type}
                  options={EXIT_TYPE_OPTIONS.filter((opt) => opt.value !== "CONTRACTUAL")}
                  onChange={(v) =>
                    setOffboardingForm((p) => ({
                      ...p,
                      exit_type:
                        v === "INVOLUNTARY" || v === "VOLUNTARY" || v === "CONTRACTUAL"
                          ? (v as ExitType)
                          : "",
                    }))
                  }
                  disabled={submitting}
                />
              )}
              {selectedCandidate && isConsultantOffboarding ? (
                <div className="text-xs text-wt-text-muted flex flex-col gap-1">
                  <span>Exit Type</span>
                  <p className="rounded-lg border border-wt-border bg-wt-surface-2 px-3 py-2 text-sm text-wt-text">
                    Contractual
                  </p>
                </div>
              ) : null}
              <TextAreaField
                label="Details"
                required
                className="md:col-span-2"
                rows={5}
                value={offboardingForm.reason}
                onChange={(v) => setOffboardingForm((p) => ({ ...p, reason: v }))}
                placeholder="Enter a detailed reason for offboarding"
              />
              <TextAreaField
                label="Critical Skill"
                required
                className="md:col-span-2"
                rows={5}
                value={offboardingForm.critical_skill}
                onChange={(v) => setOffboardingForm((p) => ({ ...p, critical_skill: v }))}
                placeholder="Describe critical skills impacted by this exit"
              />
              <div className="md:col-span-2">
                <Label className="inline-flex w-fit cursor-pointer items-center gap-2 text-xs font-normal text-wt-text-muted">
                  <Checkbox
                    checked={offboardingForm.is_regretted}
                    disabled={submitting}
                    onCheckedChange={(checked) =>
                      setOffboardingForm((p) => ({ ...p, is_regretted: Boolean(checked) }))
                    }
                  />
                  Is Regretted
                </Label>
              </div>
            </div>
            {offboardingNoticeLabel ? (
              <p className="text-sm text-wt-text-muted">{offboardingNoticeLabel}</p>
            ) : null}
            {isInvitedOffboarding ? (
              <p className="text-sm text-wt-text-muted">
                This employee has not joined yet. They will be marked inactive immediately and will
                not receive an exit survey.
              </p>
            ) : null}
            <div className={CARD_FORM_ACTIONS_CLASS}>
              <Button
                variant="brand"
                size="sm"
                type="button"
                className="px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSubmit || submitting || loadingCandidates}
                onClick={() => void submitOffboarding()}
              >
                {submitting ? "Submitting Offboarding…" : "Submit Offboarding"}
              </Button>
            </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ManagementListCard
        title="Offboarded Employees"
        description={
          loadingList
            ? "Loading offboarded employees…"
            : `${listTotal} total employee${listTotal === 1 ? "" : "s"}`
        }
        search={
          <SearchInput
            id="offboard-list-search"
            value={search}
            onChange={setSearch}
            placeholder="Search"
            aria-label="Search offboarded employees"
          />
        }
        filters={
          <>
            <DatePickerField
              label="From Date"
              value={filterFromDate}
              onChange={setFilterFromDate}
              className="w-[10.5rem] shrink-0"
            />
            <DatePickerField
              label="To Date"
              value={filterToDate}
              onChange={setFilterToDate}
              className="w-[10.5rem] shrink-0"
            />
            <DropdownSelectField
              label="User Type"
              className="w-[10.5rem] shrink-0"
              value={filterType || "ALL"}
              onChange={(value) => setFilterType(value === "ALL" ? "" : value)}
              placeholder="All types"
              options={[
                { value: "ALL", label: "All types" },
                ...USER_TYPE_FILTER_OPTIONS.filter(Boolean).map((t) => ({
                  value: t,
                  label: formatUserTypeLabel(t),
                })),
              ]}
            />
            {selectedResendableCount > 0 ? (
              <Button
                variant="brand"
                size="sm"
                type="button"
                className="h-10 px-3 py-2 text-sm"
                disabled={loadingList || bulkResending || Boolean(resendingEmpId)}
                onClick={() => void handleBulkResendExitSurvey()}
              >
                {bulkResending
                  ? "Sending…"
                  : `Resend Exit Survey (${selectedResendableCount})`}
              </Button>
            ) : null}
          </>
        }
      >
        {bulkResendResults.length ? (
          <div className="space-y-2 rounded-xl border border-wt-border bg-wt-surface-2/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">Bulk Resend Results</h4>
              <Button variant="ghost" size="xs" type="button" className="px-2 py-1 text-xs" onClick={() => setBulkResendResults([])}
              >
                Dismiss
              </Button>
            </div>
            <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
              {bulkResendResults.map((result) => (
                <li
                  key={`${result.emp_id}-${result.status}`}
                  className={`rounded-lg border px-3 py-2 ${bulkResendResultClassName(result.status)}`}
                >
                  <p className="font-medium">
                    {result.employee_name || result.emp_id}
                    {result.email ? ` · ${result.email}` : ""}
                  </p>
                  <p className="text-xs mt-0.5">{result.message}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {loadingList && !listCache.loaded ? (
          <TableRowsSkeleton rows={8} columns={11} />
        ) : listFetched && !loadingList && !displayRows.length ? (
          <EmptyState
            title="No Offboarded Employees Found"
            description="Try adjusting your search or Last Working Day filters."
          />
        ) : (
          <>
            <div className="relative">
                  {loadingList ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-wt-surface-1/60">
                  <WtLoader size="md" label="Loading offboarding list" />
                </div>
              ) : null}
              <div className={INNER_SCROLL_CLASS}>
                <WtTable className="min-w-full border-separate border-spacing-0">
                  <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">
                        <span className="sr-only">Select</span>
                        <TableCheckbox
                          checked={allResendableOnPageSelected}
                          indeterminate={
                            someResendableOnPageSelected && !allResendableOnPageSelected
                          }
                          disabled={
                            !resendableEmpIdsOnPage.length ||
                            loadingList ||
                            bulkResending ||
                            Boolean(resendingEmpId)
                          }
                          onCheckedChange={(checked) => toggleSelectAllOnPage(checked)}
                          aria-label="Select all resendable employees on this page"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Exit Type</TableHead>
                      <TableHead>Resignation</TableHead>
                      <TableHead>Last Working Day</TableHead>
                      <TableHead className="text-right">
                        Notice (days)
                      </TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Band</TableHead>
                      <TableHead>Regretted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayRows.map((row) => {
                      const empId = String(row.emp_id ?? "").trim();
                      const canResend = isResendableOffboardListRow(row);
                      const isResending = Boolean(empId && resendingEmpId === empId);
                      const isSelected = Boolean(empId && selectedEmpIds.includes(empId));
                      const surveySubmitted =
                        row.exit_survey_submitted === true || row.submission_status === "SUBMITTED";
                      const detailHref = exitSurveySubmissionDetailHref({
                        lookup_id: row.lookup_id,
                        emp_id: row.emp_id,
                        email: row.email,
                        can_view_submission: row.can_view_submission,
                        exit_survey_submitted: row.exit_survey_submitted,
                        submission_status: row.submission_status,
                      });
                      const canView = Boolean(detailHref);

                      return (
                      <TableRow
                        key={row.emp_id}
                        className={`hover:bg-wt-page-bg/50 ${
                          isSelected ? TABLE_ROW_SELECTED_CLASS : ""
                        } ${canView ? "cursor-pointer" : ""}`}
                        onClick={(event) => {
                          if (!canView || !detailHref) return;
                          const target = event.target as HTMLElement;
                          if (
                            target.closest("button, a, input, label, [data-no-row-nav]")
                          ) {
                            return;
                          }
                          router.push(detailHref);
                        }}
                      >
                        <TableCell className="px-3 py-2" data-no-row-nav>
                          {canResend ? (
                            <TableCheckbox
                              checked={isSelected}
                              disabled={loadingList || bulkResending || isResending}
                              onCheckedChange={(checked) =>
                                toggleRowSelection(empId, checked)
                              }
                              aria-label={`Select ${row.employee_name || empId}`}
                            />
                          ) : null}
                        </TableCell>
                        <TableCell className="px-3 py-2 whitespace-nowrap">
                          {canView && detailHref ? (
                            <Link
                              href={detailHref}
                              className="font-medium text-wt-text hover:text-wt-text"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {row.employee_name || "—"}
                            </Link>
                          ) : (
                            row.employee_name || "—"
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-2 whitespace-nowrap">
                          <EmployeeStatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="px-3 py-2 whitespace-nowrap">
                          {formatExitTypeLabel(row.exit_type)}
                        </TableCell>
                        <TableCell className="px-3 py-2 whitespace-nowrap tabular-nums">
                          {isLwdOnlyOffboarding({
                            userType: row.user_type,
                            exitType: row.exit_type,
                          })
                            ? "—"
                            : formatApiDateDisplay(row.resignation_date) || "—"}
                        </TableCell>
                        <TableCell className="px-3 py-2 whitespace-nowrap tabular-nums">
                          {formatApiDateDisplay(row.last_working_day) || "—"}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right whitespace-nowrap tabular-nums">
                          {(() => {
                            if (
                              isLwdOnlyOffboarding({
                                userType: row.user_type,
                                exitType: row.exit_type,
                              })
                            )
                              return "—";
                            const fromApi =
                              row.notice_period_days != null &&
                              Number.isFinite(Number(row.notice_period_days)) &&
                              Number(row.notice_period_days) > 0
                                ? Number(row.notice_period_days)
                                : null;
                            const fromDates = calculateNoticePeriodDays(
                              row.resignation_date,
                              row.last_working_day
                            );
                            const days = fromApi ?? fromDates;
                            return days != null ? days : "—";
                          })()}
                        </TableCell>
                        <TableCell className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate">
                          {row.designation ?? "—"}
                        </TableCell>
                        <TableCell className="px-3 py-2 whitespace-nowrap max-w-[160px] truncate">
                          {row.department ?? "—"}
                        </TableCell>
                        <TableCell className="px-3 py-2 whitespace-nowrap max-w-[160px] truncate">
                          {row.band_name ?? "—"}
                        </TableCell>
                        <TableCell className="px-3 py-2 whitespace-nowrap">{formatBool(row.is_regretted)}</TableCell>
                        <TableCell className="px-3 py-2 whitespace-nowrap" data-no-row-nav>
                          {canResend ? (
                            <Button variant="brand" size="xs" type="button" className="px-2.5 py-1 text-xs" disabled={loadingList || isResending || bulkResending} onClick={() => void handleResendExitSurvey(empId, row.email)}
                            >
                              {isResending ? "Sending…" : "Resend Exit Survey"}
                            </Button>
                          ) : surveySubmitted && detailHref ? (
                            <Link
                              href={detailHref}
                              className="text-xs font-medium text-[var(--wt-brand)] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View responses
                            </Link>
                          ) : surveySubmitted ? (
                            <span className="text-xs font-medium text-emerald-700">Submitted</span>
                          ) : (
                            <span className="text-xs text-wt-text-muted">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </WtTable>
              </div>
            </div>
            {showListPagination ? (
              <div className="border-t border-border/40 pt-4">
                <ListPagination
                  page={listPage}
                  totalPages={totalPages}
                  totalItems={displayTotal}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  pageSize={listPageSize}
                  pageSizeOptions={listPageSizeOptions}
                  onPageChange={setListPage}
                  onPageSizeChange={handleListPageSizeChange}
                  loading={loadingList}
                />
              </div>
            ) : null}
          </>
        )}
      </ManagementListCard>
    </section>
  );
}
