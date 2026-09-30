"use client";

import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import { TableRowsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WT_STICKY_TABLE_HEAD_CLASS,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatUiStatusLabel } from "@/utils/statusLabel";
import { TASK_CATEGORY_LABELS } from "@/utils/timelog/categories";
import { formatTimelogTableDate } from "@/utils/timelog/weekDates";
import { resolveTimelogProjectLabel } from "@/utils/timelog/projectLabel";
import { timelogStatusBadgeClass } from "@/utils/timelog/statusTone";
import type { TimelogTableProps } from "./TimelogTable.types";

export function TimelogTable({
  entries,
  total,
  page,
  size,
  loading,
  onPageChange,
  projectOptions = [],
}: TimelogTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  const startItem = total === 0 ? 0 : page * size + 1;
  const endItem = Math.min((page + 1) * size, total);

  if (loading && entries.length === 0) {
    return <TableRowsSkeleton rows={6} columns={8} />;
  }

  if (!loading && entries.length === 0) {
    return (
      <EmptyState
        title="No timelog entries found"
        description="Entries you log will show up here."
      />
    );
  }

  return (
    <div className="space-y-3">
      <ScrollableTable maxHeightClass="max-h-[min(60vh,520px)]">
        <WtTable>
          <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Sub category</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Manager remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const taskLabel =
                TASK_CATEGORY_LABELS[entry.task_category] ?? entry.task_category;
              return (
                <TableRow key={entry.id}>
                  <TableCell>{formatTimelogTableDate(entry.log_date)}</TableCell>
                  <TableCell className="font-medium text-wt-text">
                    {resolveTimelogProjectLabel(entry, projectOptions)}
                  </TableCell>
                  <TableCell>{taskLabel}</TableCell>
                  <TableCell>{entry.sub_category || "—"}</TableCell>
                  <TableCell className="tabular-nums font-medium text-wt-text">
                    {entry.hours}h
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {entry.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("border", timelogStatusBadgeClass(entry.status))}>
                      {formatUiStatusLabel(entry.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs">
                    {entry.manager_comment || "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </WtTable>
      </ScrollableTable>

      {total > size ? (
        <ListPagination
          className="mt-0 w-full"
          page={page}
          totalPages={totalPages}
          totalItems={total}
          rangeStart={startItem}
          rangeEnd={endItem}
          pageSize={size}
          loading={loading}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  );
}
