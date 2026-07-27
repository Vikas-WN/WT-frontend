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
import { showErrorToast } from "@/lib/toast";
import { Search, Wallet } from "lucide-react";
import { useHrLeaveBalancesList } from "@/hooks/leave/useHrLeaveBalancesList";
import { FILTER_BAR_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";

const BALANCES_TABLE_MIN_HEIGHT = "min-h-[320px]";
const BALANCES_TABLE_COL_COUNT = 6;

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
  runAction,
}: {
  actionLoading: boolean;
  runAction: (label: string, fn: () => Promise<void>) => void;
}) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(currentMonth));
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const monthOptions =
    Number(year) === currentYear
      ? MONTH_OPTIONS.filter((opt) => Number(opt.value) <= currentMonth)
      : MONTH_OPTIONS;

  const balancesQ = useHrLeaveBalancesList({
    year,
    month,
    page,
    pageSize,
    search: appliedSearch,
  });

  useEffect(() => {
    if (Number(year) === currentYear && Number(month) > currentMonth) {
      setMonth(String(currentMonth));
    }
  }, [year, month, currentYear, currentMonth]);

  useEffect(() => {
    if (!balancesQ.error) return;
    const message =
      balancesQ.error instanceof Error
        ? balancesQ.error.message
        : "Could not load leave balances.";
    showErrorToast(message);
  }, [balancesQ.error]);

  const rows = balancesQ.data?.items ?? [];
  const totalPages = Math.max(1, balancesQ.data?.total_pages ?? 1);
  const totalElements = balancesQ.data?.total_elements ?? 0;
  const loading = balancesQ.isFetching && !balancesQ.isPlaceholderData;
  const loadError =
    balancesQ.error instanceof Error
      ? balancesQ.error.message
      : balancesQ.error
        ? "Could not load leave balances."
        : null;
  const rangeStart = totalElements ? page * pageSize + 1 : 0;
  const rangeEnd = Math.min(totalElements, (page + 1) * pageSize);

  function applySearch() {
    const next = search.trim();
    if (next === appliedSearch.trim() && page === 0) {
      runAction("Load leave balances", async () => {
        await balancesQ.refetch();
      });
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
                value={year}
                onChange={(value) => {
                  setYear(value);
                  setPage(0);
                }}
                options={YEAR_OPTIONS}
              />
              <SelectField
                label="Month"
                value={month}
                onChange={(value) => {
                  setMonth(value);
                  setPage(0);
                }}
                options={monthOptions}
                contentClassName="w-auto min-w-[11rem]"
              />
            </div>
            <Button
              variant="brand"
              type="submit"
              className="h-10 w-full shrink-0 gap-2 px-5 lg:w-auto"
              disabled={actionLoading || balancesQ.isFetching}
            >
              <Search className="size-4" />
              Search
            </Button>
          </div>
        </form>

        {loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/20">
            <p className="text-sm text-red-700 dark:text-red-400">{loadError}</p>
          </div>
        ) : null}

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !rows.length ? (
                Array.from({ length: 6 }).map((_, rowIndex) => (
                  <TableRow key={`balances-skeleton-${rowIndex}`} className="hover:bg-transparent">
                    {Array.from({ length: BALANCES_TABLE_COL_COUNT }).map((_, colIndex) => (
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
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={BALANCES_TABLE_COL_COUNT}
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
              pageSizeOptions={[25, 50, 100]}
              onPageChange={(p) => setPage(Math.max(0, p - 1))}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
            />
          </div>
        ) : null}
      </div>
    </FormSection>
  );
}
