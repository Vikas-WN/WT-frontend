"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WtTable,
  WT_STICKY_TABLE_HEAD_CLASS,
} from "@/components/dashboard/ui/wtTable";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import { TableSortHeader } from "@/components/dashboard/ui/TableSortHeader";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import type { useClientPagination } from "@/hooks/useClientPagination";
import { DatePicker } from "@/components/ui/date-picker";

import {
  formatApprovalStageLabel,
  requestFinalStatus,
  requestManagerStatus,
  requestRejectionReason,
} from "@/utils/userRequest";
import {
  activeSortDirectionForColumn,
  type ListSortOption,
  toggleColumnSort,
} from "@/utils/listSort";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { IconPencil, IconTrash } from "@/components/dashboard/ui/icons";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { Inbox } from "lucide-react";
import { formatUserRequestTypeLabel } from "@/utils/actionToast";

type SortOption = ListSortOption<Record<string, unknown>>;
type Pagination = ReturnType<typeof useClientPagination<Record<string, unknown>>>;

export function MyLeaveRequestsView({
  rows,
  loading,
  sortId,
  onSortChange,
  sortOptions,
  pagination,
  actionLoading,
  onRefresh,
  onEdit,
  onRevoke,
  emptyLabel = "No Leave Requests",
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  showRequestType = false,
}: {
  rows: Array<Record<string, unknown>>;
  loading: boolean;
  sortId: string;
  onSortChange: (id: string) => void;
  sortOptions: SortOption[];
  pagination: Pagination;
  actionLoading: boolean;
  onRefresh: () => void;
  onEdit: (row: Record<string, unknown>) => void;
  onRevoke: (requestId: string, requestType: unknown) => void;
  emptyLabel?: string;
  fromDate?: string;
  toDate?: string;
  onFromDateChange?: (v: string) => void;
  onToDateChange?: (v: string) => void;
  showRequestType?: boolean;
}) {
  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <h3 className="text-base font-semibold tracking-tight">Previous Requests</h3>
        <div className="flex items-end gap-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground whitespace-nowrap">From</span>
              <DatePicker value={fromDate ?? ""} onChange={(v) => onFromDateChange?.(v)} />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground whitespace-nowrap">To</span>
              <DatePicker value={toDate ?? ""} onChange={(v) => onToDateChange?.(v)} />
            </div>
          </div>
          <RefreshIconButton
            onClick={onRefresh}
            disabled={actionLoading}
            loading={loading}
          />
        </div>
      </div>

      <ScrollableTable
        maxHeightClass="max-h-[min(50vh,380px)]"
        className=""
      >
        <WtTable>
          <TableHeader className={`${WT_STICKY_TABLE_HEAD_CLASS} text-[11px] font-semibold tracking-wider text-muted-foreground bg-muted/40`}>
            <TableRow className="hover:bg-transparent h-10">
              <TableHead className="font-semibold px-3">
                <TableSortHeader
                  label="From"
                  activeDirection={activeSortDirectionForColumn(
                    "from", sortId, sortOptions
                  )}
                  sortable
                  onSort={() =>
                    onSortChange(toggleColumnSort("from", sortId, sortOptions))
                  }
                />
              </TableHead>
              <TableHead className="font-semibold px-3">To</TableHead>
              {showRequestType ? <TableHead className="font-semibold px-3">Request Type</TableHead> : null}
              <TableHead className="font-semibold px-3">Manager status</TableHead>
              <TableHead className="font-semibold px-3">Comments</TableHead>
              <TableHead className="font-semibold px-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {Array.from({ length: showRequestType ? 6 : 5 }).map((_, colIndex) => (
                    <TableCell key={colIndex} className="px-3 py-2.5">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pagination.pageItems.length ? (
              pagination.pageItems.map((row, idx) => {
                const requestId = String(
                  row.user_request_id ??
                    row.userRequestId ??
                    row.request_id ??
                    row.requestId ??
                    row.id ??
                    ""
                ).trim();
                const rowRecord = row as Record<string, unknown>;
                const finalStatus = requestFinalStatus(rowRecord);
                const managerStatus = requestManagerStatus(rowRecord);
                const isPending = finalStatus === "PENDING";
                const rejectionReason =
                  managerStatus === "REJECTED" || finalStatus === "REJECTED"
                    ? requestRejectionReason(rowRecord)
                    : null;
                return (
                    <TableRow key={`${requestId || "req"}-${idx}`}>
                    <TableCell className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {String(
                        row.request_from_date ?? row.requestFromDate ?? "—"
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {String(
                        row.request_to_date ?? row.requestToDate ?? "—"
                      )}
                    </TableCell>
                    {showRequestType ? (
                      <TableCell className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                        {formatUserRequestTypeLabel(
                          row.request_type ?? row.requestType,
                          Boolean(row.is_half_day ?? row.isHalfDay ?? false)
                        )}
                      </TableCell>
                    ) : null}
                    <TableCell className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <Badge
                          className={
                            managerStatus === "APPROVED"
                              ? `rounded-full border-0 font-normal ${filledBadgeClass("success")}`
                              : managerStatus === "REJECTED"
                                ? `rounded-full border-0 font-normal ${filledBadgeClass("danger")}`
                                : "rounded-full border-0 font-normal bg-muted/60 text-muted-foreground"
                          }
                        >
                          {formatApprovalStageLabel(managerStatus)}
                        </Badge>
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
                    <TableCell className="px-3 py-2.5 max-w-[200px] truncate text-muted-foreground">
                      {String(row.comments ?? "—")}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          disabled={actionLoading || !requestId || !isPending}
                          onClick={() => onEdit(row)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <IconPencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={actionLoading || !requestId || !isPending}
                          onClick={() =>
                            onRevoke(requestId, row.request_type ?? row.requestType)
                          }
                          className="text-muted-foreground hover:text-destructive"
                          title="Revoke"
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={showRequestType ? 6 : 5}
                  className="h-[200px] text-center align-middle"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="size-8 text-muted-foreground/40" />
                    <span className="text-sm text-muted-foreground">
                      {rows.length ? "No requests match your search." : emptyLabel}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </WtTable>
      </ScrollableTable>
      {pagination.totalItems > 0 ? (
        <div className="border-t border-border/50 px-0 py-3">
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
        </div>
      ) : null}
    </div>
  );
}
