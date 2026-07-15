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
import { useCallback, useEffect, useState } from "react";
import { hrmsService, type LeaveBalancesListItem } from "@/services/hrms.service";
import { InputField } from "@/components/dashboard/ui/forms";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { showErrorToast } from "@/lib/toast";
import { Wallet } from "lucide-react";

const BALANCES_TABLE_MIN_HEIGHT = "min-h-[320px]";
const BALANCES_TABLE_COL_COUNT = 6;

function validateLeaveBalancePeriod(yearRaw: string, monthRaw: string): {
  year: number;
  month: number;
} {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const year = Number(String(yearRaw).trim());
  const month = Number(String(monthRaw).trim());

  if (!Number.isInteger(year) || year < 2000 || year > currentYear) {
    throw new Error(`Enter a valid year between 2000 and ${currentYear}.`);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Enter a valid month between 1 and 12.");
  }
  if (year === currentYear && month > currentMonth) {
    throw new Error("Future months are not allowed.");
  }
  return { year, month };
}

export function HrLeaveBalancesPanel({
  actionLoading,
  runAction,
}: {
  actionLoading: boolean;
  runAction: (label: string, fn: () => Promise<void>) => void;
}) {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [rows, setRows] = useState<LeaveBalancesListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { year: yearNum, month: monthNum } = validateLeaveBalancePeriod(year, month);
      const res = await hrmsService.getLeaveBalancesList({
        page,
        size: pageSize,
        search: debouncedSearch.trim() || undefined,
        year: yearNum,
        month: monthNum,
      });
      const data = res.data;
      setRows(data?.items ?? []);
      setTotalPages(Math.max(1, data?.total_pages ?? 1));
      setTotalElements(data?.total_elements ?? 0);
    } catch (err) {
      setRows([]);
      setTotalElements(0);
      const message = err instanceof Error ? err.message : "Could not load leave balances.";
      setLoadError(message);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, year, month]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const rangeStart = totalElements ? page * pageSize + 1 : 0;
  const rangeEnd = Math.min(totalElements, (page + 1) * pageSize);

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-zinc-950 rounded-xl border border-border/40 shadow-sm">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
          <Wallet className="size-4 text-muted-foreground" />
          Leave Balances
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Organization leave and comp-off balances by month (HR / Admin).
        </p>
      </div>

      <div className="flex flex-col sm:flex-row w-full items-end gap-3">
        <div className="w-full sm:min-w-0 sm:flex-[2]">
          <InputField
            label="Search"
            type="search"
            value={search}
            onChange={setSearch}
            placeholder="Name, email, emp id"
          />
        </div>
        <div className="w-full sm:min-w-0 sm:flex-1">
          <InputField label="Year" value={year} onChange={setYear} type="number" />
        </div>
        <div className="w-full sm:min-w-0 sm:flex-1">
          <InputField label="Month" value={month} onChange={setMonth} type="number" />
        </div>
        <Button
          variant="brand"
          type="button"
          className="shrink-0 px-5 py-2 h-10 w-full sm:w-auto"
          disabled={actionLoading || loading}
          onClick={() =>
            runAction("Load leave balances", async () => {
              setPage(0);
              await load();
            })
          }
        >
          Search
        </Button>
      </div>

      {loadError ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 px-4 py-3">
          <p className="text-sm text-red-700 dark:text-red-400">{loadError}</p>
        </div>
      ) : null}

      <ScrollableTable
        maxHeightClass="max-h-[min(60vh,480px)]"
        className={BALANCES_TABLE_MIN_HEIGHT}
        scrollChain
      >
        <WtTable>
          <TableHeader className={`${WT_STICKY_TABLE_HEAD_CLASS} text-[11px] font-semibold tracking-wider text-muted-foreground/70 bg-muted/30`}>
            <TableRow className="hover:bg-transparent h-10">
              <TableHead className="font-semibold px-4">Employee</TableHead>
              <TableHead className="font-semibold px-4">Primary</TableHead>
              <TableHead className="font-semibold px-4">Secondary</TableHead>
              <TableHead className="font-semibold px-4">Carry Forward</TableHead>
              <TableHead className="font-semibold px-4">Total</TableHead>
              <TableHead className="font-semibold px-4">Comp-Off</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={`balances-skeleton-${rowIndex}`}>
                  {Array.from({ length: BALANCES_TABLE_COL_COUNT }).map((_, colIndex) => (
                    <TableCell key={colIndex} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
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
                    className="px-4 py-3 max-w-[160px] truncate whitespace-nowrap overflow-hidden text-ellipsis"
                    title={row.employee_name || row.emp_id}
                  >
                    {row.employee_name || row.emp_id}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">{row.leave?.primary ?? "—"}</TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">{row.leave?.secondary ?? "—"}</TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">{row.leave?.carry_forward ?? "—"}</TableCell>
                  <TableCell className="px-4 py-3 tabular-nums font-medium">{row.leave?.total ?? "—"}</TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">{row.comp_off_balance ?? "—"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={BALANCES_TABLE_COL_COUNT}
                  className="h-[280px] text-center align-middle"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Wallet className="size-8 text-muted-foreground/30" />
                    <span className="text-sm text-muted-foreground">
                      {loadError ? "Failed to load data." : "No Data"}
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
  );
}
