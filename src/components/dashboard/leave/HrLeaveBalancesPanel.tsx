"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useEffect, useState } from "react";
import { InputField, SelectField } from "@/components/dashboard/ui/forms";
import { FormSection } from "@/components/dashboard/ui/FormSection";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/hooks/useClientPagination";
import { showErrorToast } from "@/lib/toast";
import { Pencil, Search, Wallet } from "lucide-react";
import { useHrLeaveBalancesList, validateLeaveBalancePeriod } from "@/hooks/leave/useHrLeaveBalancesList";
import { FILTER_BAR_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { EditLeaveBalanceDialog } from "@/components/dashboard/leave/EditLeaveBalanceDialog";
import type { LeaveBalancesListItem } from "@/services/hrms.service";

const BALANCES_TABLE_MIN_HEIGHT = "min-h-[320px]";

const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function buildYearOptions(currentYear: number) {
  const years: { value: string; label: string }[] = [];
  for (let y = currentYear; y >= 2000; y -= 1) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

const YEAR_OPTIONS = buildYearOptions(new Date().getFullYear());

export function HrLeaveBalancesPanel({
  actionLoading,
}: {
  actionLoading: boolean;
}) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(currentMonth));
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [yearError, setYearError] = useState<string | null>(null);
  const [monthError, setMonthError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<LeaveBalancesListItem | null>(null);

  const { user } = useAuth();
  const canEditBalances = Boolean(user?.roles.includes("ROLE_ADMIN"));
  const columnCount = canEditBalances ? 7 : 6;

  const monthOptions =
    Number(year) === currentYear
      ? MONTH_OPTIONS.filter((opt) => Number(opt.value) <= currentMonth)
      : MONTH_OPTIONS;

  const periodValid = (() => {
    try {
      validateLeaveBalancePeriod(year, month);
      return true;
    } catch {
      return false;
    }
  })();

  const balancesQ = useHrLeaveBalancesList({
    year,
    month,
    page,
    pageSize,
    search: appliedSearch,
    // Do not fetch until Year + Month are valid — blocks load on cleared/invalid Year.
    enabled: periodValid,
  });

  useEffect(() => {
    // Only clamp future months — never re-fill a deliberately cleared Month field.
    if (!month.trim()) return;
    if (Number(year) === currentYear && Number(month) > currentMonth) {
      setMonth(String(currentMonth));
    }
  }, [year, month, currentYear, currentMonth]);

  useEffect(() => {
    // API failures only. Period validation is toasting from applySearch — never pair with success.
    if (!periodValid || !balancesQ.error) return;
    const message =
      balancesQ.error instanceof Error
        ? balancesQ.error.message
        : "Could not load leave balances.";
    if (
      /year is required|month is required|valid year|valid month|future months/i.test(message)
    ) {
      return;
    }
    showErrorToast(message);
  }, [balancesQ.error, periodValid]);

  const rows = periodValid ? (balancesQ.data?.items ?? []) : [];
  const totalPages = Math.max(1, balancesQ.data?.total_pages ?? 1);
  const totalElements = periodValid ? (balancesQ.data?.total_elements ?? 0) : 0;
  const loading = periodValid && balancesQ.isFetching && !balancesQ.isPlaceholderData;
  const loadError =
    periodValid && balancesQ.error
      ? balancesQ.error instanceof Error
        ? balancesQ.error.message
        : "Could not load leave balances."
      : null;
  const rangeStart = totalElements ? page * pageSize + 1 : 0;
  const rangeEnd = Math.min(totalElements, (page + 1) * pageSize);

  function applySearch() {
    try {
      validateLeaveBalancePeriod(year, month);
      setYearError(null);
      setMonthError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Select a valid year and month before searching.";
      const isYearIssue = /year/i.test(message);
      const isMonthIssue = /month/i.test(message);
      setYearError(isYearIssue ? message : null);
      setMonthError(isMonthIssue && !isYearIssue ? message : null);
      // Single validation toast — do not load and do not show success.
      showErrorToast(message);
      return;
    }

    const next = search.trim();
    if (next === appliedSearch.trim() && page === 0) {
      // Silent refetch only after validation passed. Never use runAction here.
      void balancesQ.refetch();
      return;
    }
    setAppliedSearch(next);
    setPage(0);
  }

  return (
    <FormSection
      title="Leave Balances"
      description="Organization leave and Comp-Off balances by month (HR / Admin)."
      className="rounded-2xl shadow-sm"
    >
      <div className="space-y-6">
        <form
          className={cn(FILTER_BAR_CLASS)}
          onSubmit={(event) => {
            event.preventDefault();
            applySearch();
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1 lg:flex-[2]">
              <InputField
                label="Search"
                type="search"
                value={search}
                onChange={setSearch}
                placeholder="Name, Email, Emp Id"
              />
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:max-w-xs">
              <SelectField
                label="Year"
                required
                value={year}
                onChange={(value) => {
                  setYear(value);
                  setYearError(null);
                  setPage(0);
                }}
                options={YEAR_OPTIONS}
                placeholder="Select year"
                contentClassName="w-auto min-w-[7rem]"
                error={yearError}
              />
              <SelectField
                label="Month"
                required
                value={month}
                onChange={(value) => {
                  setMonth(value);
                  setMonthError(null);
                  setPage(0);
                }}
                options={monthOptions}
                placeholder="Select month"
                contentClassName="w-auto min-w-[11rem]"
                error={monthError}
              />
            </div>
            <Button
              variant="brand"
              type="submit"
              className="h-10 w-full shrink-0 gap-2 px-5 lg:w-auto"
              disabled={actionLoading || loading}
            >
              <Search className="size-4" />
              Search
            </Button>
          </div>
        </form>

        <ScrollableTable
          maxHeightClass="max-h-[min(60vh,480px)]"
          className={BALANCES_TABLE_MIN_HEIGHT}
          scrollChain
        >
          <WtTable>
            <TableHeader
              className={`${WT_STICKY_TABLE_HEAD_CLASS} bg-muted/30 text-[11px] font-semibold tracking-wider text-muted-foreground/70`}
            >
              <TableRow className="h-11 hover:bg-transparent">
                <TableHead className="px-4 font-semibold">Employee</TableHead>
                <TableHead className="px-4 font-semibold">Primary</TableHead>
                <TableHead className="px-4 font-semibold">Secondary</TableHead>
                <TableHead className="px-4 font-semibold">Carry Forward</TableHead>
                <TableHead className="px-4 font-semibold">Total</TableHead>
                <TableHead className="px-4 font-semibold">Comp-Off</TableHead>
                {canEditBalances ? (
                  <TableHead className="px-4 font-semibold text-right">Actions</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !rows.length ? (
                Array.from({ length: 6 }).map((_, rowIndex) => (
                  <TableRow key={`balances-skeleton-${rowIndex}`} className="hover:bg-transparent">
                    {Array.from({ length: columnCount }).map((_, colIndex) => (
                      <TableCell key={colIndex} className="px-4 py-3.5">
                        <Skeleton
                          className={`h-4 ${colIndex === 0 ? "w-36 max-w-full" : "w-12"}`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length ? (
                rows.map((row, idx) => (
                  <TableRow
                    key={`${row.emp_id}-${idx}`}
                    className={idx % 2 === 1 ? "bg-muted/20" : ""}
                  >
                    <TableCell
                      className="max-w-[200px] truncate overflow-hidden px-4 py-3.5 text-ellipsis whitespace-nowrap font-medium"
                      title={row.employee_name || row.emp_id}
                    >
                      {row.employee_name || row.emp_id}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 tabular-nums">
                      {row.leave?.primary ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 tabular-nums">
                      {row.leave?.secondary ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 tabular-nums">
                      {row.leave?.carry_forward ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 font-medium tabular-nums">
                      {row.leave?.total ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 tabular-nums">
                      {row.comp_off_balance ?? "—"}
                    </TableCell>
                    {canEditBalances ? (
                      <TableCell className="px-4 py-3.5 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 px-2.5"
                          title="Edit balance"
                          onClick={() => setEditingEmployee(row)}
                        >
                          <Pencil className="size-3.5" aria-hidden />
                          <span className="hidden lg:inline">Edit</span>
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columnCount}
                    className="h-[280px] text-center align-middle"
                  >
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-wt-surface-2">
                        <Wallet className="size-6 text-muted-foreground/50" />
                      </div>
                      <span className="text-sm font-medium text-wt-text">
                        {loadError ? "Failed To Load Data" : "No Balances Found"}
                      </span>
                      <span className="max-w-sm text-sm text-muted-foreground">
                        {loadError
                          ? "Adjust the period or try again."
                          : !periodValid
                            ? "Select a year and month to view leave balances."
                            : "Try a different search, year, or month."}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </WtTable>
        </ScrollableTable>

        {totalElements > 0 ? (
          <div className="border-t border-border/40 pt-4">
            <ListPagination
              page={page + 1}
              totalPages={totalPages}
              totalItems={totalElements}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={(p) => setPage(Math.max(0, p - 1))}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
            />
          </div>
        ) : null}
      </div>

      {canEditBalances ? (
        <EditLeaveBalanceDialog
          open={editingEmployee != null}
          employee={editingEmployee}
          year={Number(year)}
          month={Number(month)}
          onClose={() => setEditingEmployee(null)}
          onSaved={async () => {
            await balancesQ.refetch();
          }}
        />
      ) : null}
    </FormSection>
  );
}
