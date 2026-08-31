"use client";

import { useEffect, useRef, useState } from "react";
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
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { UI_COPY } from "@/constants/uiCopy";
import { LeaveRequestStatusBadge } from "@/components/dashboard/leave/LeaveRequestStatusBadge";
import { LeaveManagerEmailsCell } from "@/components/dashboard/leave/LeaveManagerEmailsCell";
import { FormSection } from "@/components/dashboard/ui/FormSection";
import { SelectField } from "@/components/dashboard/ui/forms";
import { formatUserRequestTypeLabel } from "@/utils/actionToast";
import { formatLeaveDateRange, formatLeaveDaysCount } from "@/utils/leaveRequestDisplay";
import { useNonOptionalHolidayDates } from "@/hooks/leave/useNonOptionalHolidayDates";
import { pickManagerEmailList } from "@/utils/leaveManagerDisplay";
import { requestFinalStatus, requestRejectionReason, isEmployeeEditableUserRequest, resolveUserRequestId } from "@/utils/userRequest";
import { Eye, Filter, Info, MoreVertical } from "lucide-react";
import type { useClientPagination } from "@/hooks/useClientPagination";

const TABLE_COL_COUNT = 6;
const TABLE_MIN_HEIGHT = "min-h-[280px]";

type Pagination = ReturnType<typeof useClientPagination<Record<string, unknown>>>;

type RowRecord = Record<string, unknown>;

export function MyPreviousLeaveRequestsCard({
  rows,
  loading,
  search,
  onSearchChange,
  sortId,
  onSortChange,
  pagination,
  totalFilteredCount,
  actionLoading,
  onView,
  onEdit,
  onRevoke,
}: {
  rows: RowRecord[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  sortId: string;
  onSortChange: (value: string) => void;
  pagination: Pagination;
  totalFilteredCount: number;
  actionLoading: boolean;
  onView: (row: RowRecord) => void;
  onEdit: (row: RowRecord) => void;
  onRevoke: (row: RowRecord) => void;
}) {
  const holidayDates = useNonOptionalHolidayDates();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <FormSection title="My Requests" className="rounded-2xl shadow-sm">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="sr-only" htmlFor="my-leave-search">
            Search my requests
          </label>
          <input
            id="my-leave-search"
            type="search"
            className="input-field h-10 w-full px-3 py-2 text-sm sm:max-w-md"
            placeholder="Search by type, date, status..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search my leave requests"
          />
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 gap-2 px-4"
            onClick={() => setFiltersOpen((value) => !value)}
            aria-expanded={filtersOpen}
          >
            <Filter className="size-4" aria-hidden />
            Filter
          </Button>
        </div>

        {filtersOpen ? (
          <div className="max-w-xs">
            <SelectField
              label="Sort By"
              value={sortId}
              options={[
                { value: "from_desc", label: "Date (Newest)" },
                { value: "from_asc", label: "Date (Oldest)" },
              ]}
              onChange={onSortChange}
            />
          </div>
        ) : null}

        <ScrollableTable maxHeightClass="max-h-[min(50vh,380px)]" className={TABLE_MIN_HEIGHT}>
          <WtTable>
            <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date Range</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approver(s)</TableHead>
                <TableHead>Days</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={`my-leave-skeleton-${rowIndex}`}>
                    {Array.from({ length: TABLE_COL_COUNT }).map((_, colIndex) => (
                      <TableCell key={colIndex} className="px-3 py-2.5">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pagination.pageItems.length ? (
                pagination.pageItems.map((row, idx) => {
                  const rowRecord = row as RowRecord;
                  const requestId = resolveUserRequestId(rowRecord);
                  const finalStatus = requestFinalStatus(rowRecord);
                  const canEditOrRevoke = isEmployeeEditableUserRequest(rowRecord);
                  const rejectionReason =
                    finalStatus === "REJECTED" ? requestRejectionReason(rowRecord) : null;
                  const primaryManagers = pickManagerEmailList(rowRecord, "primary");
                  const secondaryManagers = pickManagerEmailList(rowRecord, "secondary");
                  const approverEmails = [...primaryManagers, ...secondaryManagers];
                  const fromDate = String(rowRecord.request_from_date ?? rowRecord.requestFromDate ?? "");
                  const toDate = String(rowRecord.request_to_date ?? rowRecord.requestToDate ?? "");
                  const isHalfDay = Boolean(rowRecord.is_half_day ?? rowRecord.isHalfDay ?? false);
                  const leaveReason = String(rowRecord.comments ?? "").trim();

                  return (
                    <TableRow key={`${requestId || "myreq"}-${idx}`}>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span>{formatLeaveDateRange(fromDate, toDate, isHalfDay)}</span>
                          {leaveReason ? (
                            <span
                              title={leaveReason}
                              className="inline-flex cursor-help text-wt-text-muted"
                              aria-label={`Leave reason: ${leaveReason}`}
                            >
                              <Info className="size-3.5 shrink-0" aria-hidden />
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap">
                        {formatUserRequestTypeLabel(rowRecord.request_type ?? rowRecord.requestType, isHalfDay)}
                      </TableCell>
                      <TableCell className="px-3 py-2.5">
                        <div className="flex flex-col items-start gap-1">
                          <LeaveRequestStatusBadge status={finalStatus} />
                          {rejectionReason ? (
                            <p
                              className="max-w-[14rem] truncate text-xs text-rose-700/90"
                              title={rejectionReason}
                            >
                              {rejectionReason}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap">
                        <LeaveManagerEmailsCell emails={approverEmails} />
                      </TableCell>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                        {formatLeaveDaysCount(fromDate, toDate, isHalfDay, holidayDates)}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-wt-text-muted hover:text-wt-text"
                            aria-label="View request"
                            onClick={() => onView(rowRecord)}
                          >
                            <Eye className="size-4" aria-hidden />
                          </Button>
                          {canEditOrRevoke ? (
                            <div className="relative" ref={openMenuId === requestId ? menuRef : undefined}>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="text-wt-text-muted hover:text-wt-text"
                                aria-label="More actions"
                                aria-expanded={openMenuId === requestId}
                                disabled={actionLoading || !requestId}
                                onClick={() =>
                                  setOpenMenuId((current) => (current === requestId ? null : requestId))
                                }
                              >
                                <MoreVertical className="size-4" aria-hidden />
                              </Button>
                              {openMenuId === requestId ? (
                                <div className="absolute right-0 top-full z-20 mt-1 min-w-[8.5rem] rounded-lg border border-wt-border bg-wt-surface-1 py-1 shadow-lg">
                                  <button
                                    type="button"
                                    className="block w-full px-3 py-2 text-left text-sm hover:bg-wt-surface-2 disabled:opacity-50"
                                    disabled={actionLoading || !requestId}
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onEdit(rowRecord);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="block w-full px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                    disabled={actionLoading || !requestId}
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onRevoke(rowRecord);
                                    }}
                                  >
                                    Revoke
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={TABLE_COL_COUNT}
                    className="h-[240px] text-center align-middle text-sm text-wt-text-muted"
                  >
                    {totalFilteredCount ? UI_COPY.noSearchResults : UI_COPY.noRecordsFound}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </WtTable>
        </ScrollableTable>

        {pagination.totalItems > 0 ? (
          <ListPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            rangeStart={pagination.rangeStart}
            rangeEnd={pagination.rangeEnd}
            pageSize={pagination.pageSize}
            pageSizeOptions={pagination.pageSizeOptions}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        ) : null}
      </div>
    </FormSection>
  );
}
