"use client";

import { Button } from "@/components/ui/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WT_STICKY_TABLE_HEAD_CLASS,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import {
  WT_TABLE_CELL_COMPACT_CLASS,
  WT_TABLE_HEAD_COMPACT_CLASS,
} from "@/components/dashboard/ui/tableLayout";
import Link from "next/link";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useMemo, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { hrmsService } from "@/services/hrms.service";
import { DASHBOARD_ROUTES, employeeDirectoryProfilePath } from "@/constants/routes";
import { AccessRestricted } from "@/components/auth/AccessRestricted";
import { useEmployeeDirectoryAccess } from "@/hooks/employee-directory/useEmployeeDirectoryAccess";
import { useEmployeeDirectoryList } from "@/hooks/employee-directory/useEmployeeDirectoryList";
import { useOnboardOptions } from "@/hooks/useOnboardOptions";
import { EmployeeDeleteDialog } from "@/components/employee-directory/EmployeeDeleteDialog";
import { EmployeePortalRoleSelect } from "@/components/employee-directory/EmployeePortalRoleSelect";
import { EmployeeUserTypeSelect } from "@/components/employee-directory/EmployeeUserTypeSelect";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ManagementListCard, ManagementListContent } from "@/components/dashboard/ui/ManagementListCard";
import { FieldLabel, SelectField } from "@/components/dashboard/ui/forms";
import { SearchInput } from "@/components/dashboard/ui/SearchInput";
import { CARD_TOOLBAR_INNER_CLASS } from "@/components/dashboard/ui/uiLayout";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  cleanEmployeeName,
  extractSkillNames,
  onboardRowToListRow,
  rowDirectoryKey,
  rowEmpId,
  rowHasSkill,
  rowIsBirthdayToday,
  rowIsOnline,
} from "@/utils/employeeDirectory";
import { directoryUserTypeFilterOptions, FALLBACK_ONBOARD_OPTIONS, resolveDirectoryUserTypes } from "@/utils/onboardFormOptions";
import { EmployeeStatusBadge } from "@/components/employee-directory/EmployeeStatusBadge";
import { DirectoryEmployeeNameCell } from "@/components/employee-directory/DirectoryEmployeeNameCell";
import { DirectoryRowPreviewCard } from "@/components/employee-directory/DirectoryRowPreviewCard";
import { TableSortHeader } from "@/components/dashboard/ui/TableSortHeader";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import { useClientPagination } from "@/hooks/useClientPagination";
import { OnboardingGate } from "@/components/dashboard/shared/OnboardingGate";
import { IconTrash } from "@/components/dashboard/ui/icons";
import {
  activeSortDirectionForColumn,
  applyListSort,
  EMPLOYEE_DIRECTORY_SORT_OPTIONS,
  sortOptionsForColumn,
  toggleColumnSort,
} from "@/utils/listSort";
import { cn } from "@/lib/utils";
import { isOffboardedUserStatus, normalizeEmployeeStatusKey } from "@/utils/userStatus";
import { Users } from "lucide-react";

const EMPLOYEE_DIRECTORY_PAGE_SIZE = 10;

const LIST_COLUMNS: Array<{ key: string; label: string }> = [
  { key: "name", label: "Employee" },
  { key: "role", label: "Designation" },
  { key: "portal_role", label: "Role" },
  { key: "band", label: "Band" },
  { key: "user_type", label: "User Type" },
  { key: "work_mode", label: "Mode" },
  { key: "status", label: "Status" },
];

const DIRECTORY_STATS = [
  { key: "online", label: "Online", tone: "emerald" as const },
  { key: "active", label: "Active", tone: "brand" as const },
  { key: "invited", label: "Invited", tone: "amber" as const },
  { key: "total", label: "Total", tone: "muted" as const },
];

function normalizeUserType(value: unknown): string {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");
  if (normalized === "FULLTIME") return "FULLTIME";
  if (normalized === "INTERN") return "INTERN";
  if (normalized === "CONSULTANT") return "CONSULTANT";
  if (normalized === "HR") return "HR";
  return normalized;
}

function hasCopyableValue(value: string | undefined): boolean {
  const text = String(value ?? "").trim();
  return Boolean(text) && text !== "—";
}

export function EmployeeDirectoryPageClient() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [userTypeFilter, setUserTypeFilter] = useState("");
  const [primarySkillFilter, setPrimarySkillFilter] = useState("");
  const [secondarySkillFilter, setSecondarySkillFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [sortId, setSortId] = useState("doj_desc");
  const [deleteTarget, setDeleteTarget] = useState<{
    empId: string;
    name: string;
    email: string;
  } | null>(null);
  const onboardOptionsQ = useOnboardOptions();
  const userTypeSelectOptions = useMemo(
    () => directoryUserTypeFilterOptions(onboardOptionsQ.data),
    [onboardOptionsQ.data]
  );

  const directoryUserTypeOptions = useMemo(
    () => resolveDirectoryUserTypes(onboardOptionsQ.data ?? FALLBACK_ONBOARD_OPTIONS),
    [onboardOptionsQ.data]
  );
  const {
    authStatus,
    canView: canViewDirectory,
    canEdit: canEditDirectory,
    canDelete,
    queriesEnabled,
  } = useEmployeeDirectoryAccess();
  const { data: rows = [], isLoading, isError, error, refetch } = useEmployeeDirectoryList({
    enabled: queriesEnabled,
  });

  const primarySkillOptions = useMemo(() => {
    const fromOptions = onboardOptionsQ.data?.primary_skills || [];
    const fromRows = new Map<string, string>();
    for (const row of rows) {
      const record = row as unknown as Record<string, unknown>;
      for (const skill of extractSkillNames(record.primary_skills ?? record.primarySkills)) {
        const key = skill.toLowerCase();
        if (!fromRows.has(key)) fromRows.set(key, skill);
      }
    }
    const merged = new Map<string, string>();
    for (const item of fromOptions) {
      merged.set(item.value.toLowerCase(), item.label || item.value);
    }
    for (const [key, skill] of fromRows) {
      if (!merged.has(key)) merged.set(key, skill);
    }
    return [{ value: "", label: "All Primary Skills" }].concat(
      Array.from(merged.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([_, label]) => ({ value: label, label }))
    );
  }, [onboardOptionsQ.data, rows]);

  const secondarySkillOptions = useMemo(() => {
    const fromOptions = onboardOptionsQ.data?.secondary_skills || onboardOptionsQ.data?.primary_skills || [];
    const fromRows = new Map<string, string>();
    for (const row of rows) {
      const record = row as unknown as Record<string, unknown>;
      for (const skill of extractSkillNames(record.secondary_skills ?? record.secondarySkills)) {
        const key = skill.toLowerCase();
        if (!fromRows.has(key)) fromRows.set(key, skill);
      }
    }
    const merged = new Map<string, string>();
    for (const item of fromOptions) {
      merged.set(item.value.toLowerCase(), item.label || item.value);
    }
    for (const [key, skill] of fromRows) {
      if (!merged.has(key)) merged.set(key, skill);
    }
    return [{ value: "", label: "All Secondary Skills" }].concat(
      Array.from(merged.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([_, label]) => ({ value: label, label }))
    );
  }, [onboardOptionsQ.data, rows]);

  const departmentOptions = useMemo(() => {
    const merged = new Map<string, string>();
    for (const item of onboardOptionsQ.data?.departments ?? []) {
      const label = (item.label || item.value || "").trim();
      if (label) merged.set(label.toLowerCase(), label);
    }
    for (const row of rows) {
      const record = row as unknown as Record<string, unknown>;
      const dept = String(record.department ?? "").trim();
      if (dept && !merged.has(dept.toLowerCase())) merged.set(dept.toLowerCase(), dept);
    }
    return [{ value: "", label: "All Departments" }].concat(
      Array.from(merged.values())
        .sort((a, b) => a.localeCompare(b))
        .map((label) => ({ value: label, label }))
    );
  }, [onboardOptionsQ.data, rows]);

  const tableRows = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    const filtered = rows
      .map((row) => {
        const record = row as unknown as Record<string, unknown>;
        const empId = rowEmpId(record);
        const directoryKey = rowDirectoryKey(record);
        return { record, empId, directoryKey, display: onboardRowToListRow(row) };
      })
      .filter(({ directoryKey, record, display, empId }) => {
        // Keep invited/pre-emp-id rows visible via email so TOTAL matches the table.
        if (!directoryKey) return false;
        if (userTypeFilter && normalizeUserType(record.user_type ?? record.userType) !== userTypeFilter) {
          return false;
        }
        if (
          departmentFilter &&
          String(record.department ?? "").trim().toLowerCase() !==
            departmentFilter.trim().toLowerCase()
        ) {
          return false;
        }
        if (primarySkillFilter) {
          if (!rowHasSkill(record.primary_skills ?? record.primarySkills, primarySkillFilter)) {
            return false;
          }
        }
        if (secondarySkillFilter) {
          if (!rowHasSkill(record.secondary_skills ?? record.secondarySkills, secondarySkillFilter)) {
            return false;
          }
        }
        if (!needle) return true;
        const haystack = [
          display.name,
          display.email,
          display.personal_email,
          display.phone_number,
          display.emp_id,
          empId,
          display.role,
          display.portal_role,
          display.band,
          display.user_type,
          display.work_mode,
          display.status,
          display.primary_skills,
          display.secondary_skills,
          cleanEmployeeName(record),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      });

    const sorted = applyListSort(filtered, sortId, EMPLOYEE_DIRECTORY_SORT_OPTIONS);
    // Inactive employees always sink to the bottom after the chosen sort.
    const activeish: typeof sorted = [];
    const inactive: typeof sorted = [];
    for (const row of sorted) {
      const status = row.record.status ?? row.record.user_status ?? row.record.userStatus;
      if (isOffboardedUserStatus(status)) inactive.push(row);
      else activeish.push(row);
    }
    return [...activeish, ...inactive];
  }, [
    rows,
    debouncedSearch,
    userTypeFilter,
    primarySkillFilter,
    secondarySkillFilter,
    departmentFilter,
    sortId,
  ]);

  const directoryStats = useMemo(() => {
    let online = 0;
    let active = 0;
    let invited = 0;
    let total = 0;
    for (const row of rows) {
      const record = row as unknown as Record<string, unknown>;
      if (!rowDirectoryKey(record)) continue;
      total += 1;
      if (rowIsOnline(record)) online += 1;
      const status = normalizeEmployeeStatusKey(
        record.status ?? record.user_status ?? record.userStatus
      );
      if (status === "ACTIVE") active += 1;
      if (status === "INVITED") invited += 1;
    }
    return { total, online, active, invited };
  }, [rows]);

  const pagination = useClientPagination(tableRows, {
    pageSize: EMPLOYEE_DIRECTORY_PAGE_SIZE,
    resetKeys: [
      debouncedSearch,
      userTypeFilter,
      primarySkillFilter,
      secondarySkillFilter,
      departmentFilter,
      sortId,
    ],
  });

  const handleCopyField = useCallback(
    async (value: string, successMessage: string) => {
      const text = value.trim();
      if (!hasCopyableValue(text)) return;
      try {
        await navigator.clipboard.writeText(text);
        showSuccessToast(successMessage);
      } catch {
        showErrorToast("Could not copy to clipboard.");
      }
    },
    []
  );

  const deleteEmployeeMutation = useMutation({
    mutationFn: (empId: string) => hrmsService.deleteEmployee(empId),
    onSuccess: async () => {
      showSuccessToast("Employee deleted successfully");
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["employee-directory", "onboard"] });
      await queryClient.invalidateQueries({ queryKey: ["offboarding"] });
    },
    onError: (error: unknown) => {
      showErrorToast(error instanceof Error ? error.message : "Could not delete employee.");
    },
  });

  const actorEmail = (authUser?.email ?? "").trim().toLowerCase();

  const handleRequestDelete = useCallback(
    (empId: string, name: string, email: string) => {
      if (email.trim().toLowerCase() === actorEmail) {
        showErrorToast("You cannot delete your own account.");
        return;
      }
      setDeleteTarget({ empId, name: cleanEmployeeName({ name }) || name, email });
    },
    [actorEmail]
  );

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget?.empId) {
      deleteEmployeeMutation.mutate(deleteTarget.empId);
    }
  }, [deleteTarget, deleteEmployeeMutation]);

  if (authStatus !== "loading" && !canViewDirectory) {
    return <AccessRestricted message="Employee Directory is available to HR and admin users only." backLabel="Back to Dashboard" />;
  }

  return (
    <DashboardPageShell className="wt-detail-page">
      <OnboardingGate>
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DIRECTORY_STATS.map((stat) => {
              const value = directoryStats[stat.key as keyof typeof directoryStats];
              return (
                <div
                  key={stat.key}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border px-4 py-3 shadow-sm transition-transform duration-[var(--wt-duration)] ease-[var(--wt-ease)] hover:-translate-y-0.5",
                    stat.tone === "emerald" &&
                      "border-emerald-500/20 bg-gradient-to-br from-emerald-500/12 to-wt-surface-1",
                    stat.tone === "brand" &&
                      "border-[color-mix(in_srgb,var(--wt-brand)_22%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--wt-brand)_10%,transparent)] to-wt-surface-1",
                    stat.tone === "amber" &&
                      "border-amber-500/20 bg-gradient-to-br from-amber-500/12 to-wt-surface-1",
                    stat.tone === "muted" && "border-wt-border bg-wt-surface-1"
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-wt-text-faint">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-wt-text">
                    {value}
                  </p>
                </div>
              );
            })}
          </section>

          <ManagementListCard
            title="People directory"
            description="Search, filter, and manage employee profiles, portal roles, and presence."
            headerAction={
              <div className="hidden items-center gap-2 rounded-xl border border-wt-border bg-wt-surface-2/60 px-3 py-2 text-xs text-wt-text-muted sm:flex">
                <Users className="size-3.5 text-[var(--wt-brand)]" />
                <span>
                  Showing{" "}
                  <span className="font-semibold text-wt-text">{pagination.totalItems}</span>
                  {pagination.totalItems !== directoryStats.total ? (
                    <>
                      {" "}
                      of <span className="font-semibold text-wt-text">{directoryStats.total}</span>
                    </>
                  ) : null}{" "}
                  people
                </span>
              </div>
            }
            toolbar={
              <div className={CARD_TOOLBAR_INNER_CLASS}>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <FieldLabel label="Search" htmlFor="employee-directory-search" />
                  <SearchInput
                    id="employee-directory-search"
                    value={search}
                    onChange={setSearch}
                    placeholder="Search name, email, role…"
                    aria-label="Search employees"
                    className="h-10 border-wt-border bg-wt-surface-1 shadow-sm"
                  />
                </div>
                <div className="flex flex-wrap items-end gap-2.5">
                  <SelectField
                    label="Department"
                    className="w-[11.5rem] shrink-0 gap-1.5"
                    value={departmentFilter}
                    onChange={setDepartmentFilter}
                    options={departmentOptions}
                    placeholder="All Departments"
                    contentClassName="max-w-[min(20rem,calc(100vw-1rem))]"
                  />
                  <SelectField
                    label="User Type"
                    className="w-[11rem] shrink-0 gap-1.5"
                    value={userTypeFilter}
                    onChange={setUserTypeFilter}
                    options={userTypeSelectOptions}
                    placeholder="All User Types"
                  />
                  <SelectField
                    label="Primary Skill"
                    className="w-[11.5rem] shrink-0 gap-1.5"
                    value={primarySkillFilter}
                    onChange={setPrimarySkillFilter}
                    options={primarySkillOptions}
                    placeholder="All Primary Skills"
                    contentClassName="max-w-[min(20rem,calc(100vw-1rem))]"
                  />
                  <SelectField
                    label="Secondary Skill"
                    className="w-[11.5rem] shrink-0 gap-1.5"
                    value={secondarySkillFilter}
                    onChange={setSecondarySkillFilter}
                    options={secondarySkillOptions}
                    placeholder="All Secondary Skills"
                    align="end"
                    contentClassName="max-w-[min(20rem,calc(100vw-1rem))]"
                  />
                </div>
              </div>
            }
          >
            {isError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
                <p>Could not load employees.{error instanceof Error ? ` ${error.message}` : ""}</p>
                <Button
                  variant="ghost"
                  size="xs"
                  type="button"
                  className="mt-3 px-3 py-1.5 text-xs"
                  onClick={() => void refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : null}

            <ManagementListContent
              isLoading={isLoading}
              isEmpty={!isError && !tableRows.length}
              emptyTitle="No employees to show"
              emptyDescription={
                debouncedSearch.trim() ||
                userTypeFilter ||
                departmentFilter ||
                primarySkillFilter ||
                secondarySkillFilter
                  ? "Try adjusting your search or filters."
                  : "No employees were returned from the API."
              }
              skeletonRows={8}
              skeletonColumns={LIST_COLUMNS.length}
            >
              <>
                <div className="wt-detail-scroll-section min-h-0 overflow-hidden rounded-2xl border border-wt-border/80">
                  <ScrollableTable scrollChain maxHeightClass="max-h-[min(68vh,640px)]">
                    <WtTable className="w-full min-w-[820px] text-sm">
                      <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                        <TableRow className="hover:bg-transparent">
                          {LIST_COLUMNS.map((col) => {
                            const columnSortOpts = sortOptionsForColumn(
                              col.key,
                              EMPLOYEE_DIRECTORY_SORT_OPTIONS
                            );
                            const activeDir = columnSortOpts.length
                              ? activeSortDirectionForColumn(
                                  col.key,
                                  sortId,
                                  EMPLOYEE_DIRECTORY_SORT_OPTIONS
                                )
                              : null;
                            return (
                              <TableHead
                                key={col.key}
                                className={cn(
                                  WT_TABLE_HEAD_COMPACT_CLASS,
                                  "bg-wt-surface-2/70 whitespace-nowrap",
                                  col.key === "name" && "min-w-[11rem]",
                                  col.key === "role" && "min-w-[10rem]",
                                  col.key === "portal_role" && "min-w-[8.5rem]",
                                  col.key === "band" && "min-w-[3.75rem]",
                                  col.key === "user_type" && "min-w-[8.5rem]",
                                  col.key === "work_mode" && "min-w-[4rem]",
                                  col.key === "status" && "min-w-[6.5rem]"
                                )}
                              >
                                <TableSortHeader
                                  label={col.label}
                                  activeDirection={activeDir}
                                  sortable={columnSortOpts.length > 0}
                                  className="h-8 max-w-full px-1.5 text-xs"
                                  onSort={
                                    columnSortOpts.length
                                      ? () =>
                                          setSortId(
                                            toggleColumnSort(
                                              col.key,
                                              sortId,
                                              EMPLOYEE_DIRECTORY_SORT_OPTIONS
                                            )
                                          )
                                      : undefined
                                  }
                                />
                              </TableHead>
                            );
                          })}
                          {canDelete ? (
                            <TableHead
                              className={cn(
                                WT_TABLE_HEAD_COMPACT_CLASS,
                                "w-[2.75rem] bg-wt-surface-2/70 whitespace-nowrap text-right"
                              )}
                            >
                              <span className="sr-only">Actions</span>
                            </TableHead>
                          ) : null}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagination.pageItems.map(({ empId, directoryKey, display, record }) => {
                          const openProfile = () => {
                            if (!empId) {
                              showErrorToast(
                                "This person does not have an employee ID yet — open their profile after onboarding completes."
                              );
                              return;
                            }
                            router.push(employeeDirectoryProfilePath(empId));
                          };
                          return (
                            <DirectoryRowPreviewCard
                              key={directoryKey}
                              name={display.name}
                              designation={display.role}
                              band={display.band}
                              department={display.department}
                              email={display.email}
                              phone={display.phone_number}
                              profile={record}
                              onCopy={(value, message) => void handleCopyField(value, message)}
                              rowClassName="cursor-pointer border-wt-border/70 transition-colors hover:bg-[color-mix(in_srgb,var(--wt-brand)_6%,transparent)] dark:hover:bg-wt-surface-2"
                              onRowClick={openProfile}
                              onRowKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openProfile();
                                }
                              }}
                              rowAriaLabel={`View profile for ${display.name}`}
                            >
                              {LIST_COLUMNS.map((col) => (
                                <TableCell
                                  key={col.key}
                                  className={cn(
                                    WT_TABLE_CELL_COMPACT_CLASS,
                                    "py-2.5 whitespace-nowrap",
                                    col.key === "status" ||
                                      col.key === "portal_role" ||
                                      col.key === "user_type"
                                      ? "overflow-visible"
                                      : "max-w-[16rem] overflow-hidden"
                                  )}
                                  title={
                                    col.key === "status" ||
                                    col.key === "portal_role" ||
                                    col.key === "user_type"
                                      ? undefined
                                      : String(display[col.key] ?? "—")
                                  }
                                >
                                  {col.key === "status" ? (
                                    <EmployeeStatusBadge status={display.status} />
                                  ) : col.key === "name" ? (
                                    <DirectoryEmployeeNameCell
                                      name={display.name}
                                      empId={display.emp_id}
                                      profile={record}
                                      isOnline={rowIsOnline(record)}
                                      isBirthday={rowIsBirthdayToday(record)}
                                    />
                                  ) : col.key === "portal_role" ? (
                                    <EmployeePortalRoleSelect
                                      email={String(record.email ?? display.email ?? "")}
                                      portalRoles={record.portal_roles ?? record.portalRoles}
                                      employeeStatus={
                                        record.status ?? record.user_status ?? display.status
                                      }
                                      canEdit={
                                        canEditDirectory &&
                                        String(record.email ?? display.email ?? "")
                                          .trim()
                                          .toLowerCase() !==
                                          String(authUser?.email ?? "")
                                            .trim()
                                            .toLowerCase()
                                      }
                                      compact
                                    />
                                  ) : col.key === "user_type" ? (
                                    <EmployeeUserTypeSelect
                                      empId={empId}
                                      userType={record.user_type ?? record.userType}
                                      bandId={record.band_id ?? record.bandId}
                                      bandName={
                                        record.band ?? record.band_name ?? record.bandName
                                      }
                                      department={record.department}
                                      canEdit={
                                        canEditDirectory &&
                                        String(record.email ?? display.email ?? "")
                                          .trim()
                                          .toLowerCase() !==
                                          String(authUser?.email ?? "")
                                            .trim()
                                            .toLowerCase()
                                      }
                                      options={directoryUserTypeOptions}
                                    />
                                  ) : (
                                    <span className="block truncate text-sm text-wt-text">
                                      {display[col.key] ?? "—"}
                                    </span>
                                  )}
                                </TableCell>
                              ))}
                              {canDelete ? (
                                <TableCell
                                  className={cn(
                                    WT_TABLE_CELL_COMPACT_CLASS,
                                    "w-[2.75rem] py-2.5 whitespace-nowrap text-right"
                                  )}
                                >
                                  {display.email.trim().toLowerCase() === actorEmail ? null : !empId ? null : (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      className="text-wt-text-muted hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-40"
                                      disabled={deleteEmployeeMutation.isPending}
                                      aria-label={`Delete ${display.name}`}
                                      title="Delete employee"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRequestDelete(
                                          empId,
                                          String(record.name ?? display.name ?? ""),
                                          String(record.email ?? display.email ?? "")
                                        );
                                      }}
                                      onKeyDown={(e) => e.stopPropagation()}
                                    >
                                      <IconTrash />
                                    </Button>
                                  )}
                                </TableCell>
                              ) : null}
                            </DirectoryRowPreviewCard>
                          );
                        })}
                      </TableBody>
                    </WtTable>
                  </ScrollableTable>
                </div>
                <ListPagination
                  className="mt-3"
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  rangeStart={pagination.rangeStart}
                  rangeEnd={pagination.rangeEnd}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.setPage}
                  onPageSizeChange={pagination.setPageSize}
                />
              </>
            </ManagementListContent>
          </ManagementListCard>
        </div>
      </OnboardingGate>
      <EmployeeDeleteDialog
        open={deleteTarget !== null}
        employeeName={deleteTarget?.name ?? ""}
        employeeEmail={deleteTarget?.email ?? ""}
        loading={deleteEmployeeMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </DashboardPageShell>
  );
}
