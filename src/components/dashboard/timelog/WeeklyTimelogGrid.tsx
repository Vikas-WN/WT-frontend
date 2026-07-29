"use client";

import { Button } from "@/components/ui/button";
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
import {
  subCategoriesFor,
  subCategoryRequired,
  TASK_CATEGORY_LABELS,
  type TimelogOptionsPayload,
  type TimelogProjectOption,
} from "@/utils/timelog/categories";
import {
  dailyHourHighlight,
  dailyHourHighlightClass,
  dailyTotals,
  rowTotal,
  weeklyTotal,
} from "@/utils/timelog/gridTotals";
import type { TimelogGridRow } from "@/utils/timelog/gridState";
import {
  dayHasSubmittedEntries,
  isRowMetadataEditable,
  isTimelogCellEditable,
} from "@/utils/timelog/gridState";
import { formatDayHeader, formatHoursDisplay } from "@/utils/timelog/weekDates";
import { SearchableSelectCombobox } from "@/components/dashboard/ui/SearchableSelectCombobox";

type WeeklyTimelogGridProps = {
  rows: TimelogGridRow[];
  dayDates: Date[];
  dayKeys: string[];
  projectOptions: TimelogProjectOption[];
  readOnly?: boolean;
  canApprove?: boolean;
  onApproveDay?: (dayKey: string) => void;
  onRejectDay?: (dayKey: string) => void;
  onRowClick?: (row: TimelogGridRow) => void;
  onRowsChange: (rows: TimelogGridRow[]) => void;
};

function updateRow(rows: TimelogGridRow[], clientKey: string, patch: Partial<TimelogGridRow>): TimelogGridRow[] {
  return rows.map((row) => (row.clientKey === clientKey ? { ...row, ...patch } : row));
}

function readOnlyText(value: string | undefined | null, fallback = "—"): string {
  const trimmed = String(value ?? "").trim();
  return trimmed || fallback;
}

function projectLabel(row: TimelogGridRow, projectOptions: TimelogProjectOption[]): string {
  if (row.project_name?.trim()) return row.project_name.trim();
  const selected = projectOptions.find(
    (p) => p.project_code.toUpperCase() === row.project_code.trim().toUpperCase()
  );
  return readOnlyText(selected?.project_name ?? "—");
}

function taskCategoryLabel(row: TimelogGridRow): string {
  return readOnlyText(TASK_CATEGORY_LABELS[row.task_category] ?? row.task_category);
}

function subCategoryLabel(row: TimelogGridRow): string {
  const subOptions =
    row.project_code && row.task_category
      ? subCategoriesFor(row.project_code, row.task_category)
      : [];
  if (!subOptions.length) return "—";
  return readOnlyText(row.sub_category);
}

export function WeeklyTimelogGrid({
  rows,
  dayDates,
  dayKeys,
  projectOptions,
  readOnly = false,
  canApprove = false,
  onApproveDay,
  onRejectDay,
  onRowClick,
  onRowsChange,
}: WeeklyTimelogGridProps) {
  const totals = dailyTotals(rows, dayKeys);
  const weekSum = weeklyTotal(totals);

  const addRow = () => {
    const hours_by_date: Record<string, string> = {};
    for (const key of dayKeys) hours_by_date[key] = "";
    onRowsChange([
      ...rows,
      {
        clientKey: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        project_code: "",
        task_category: "",
        sub_category: "",
        comment: "",
        hours_by_date,
      },
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="wt-scroll-both overflow-x-auto rounded-lg border border-wt-border">
        <table className="min-w-[1040px] w-full text-sm border-collapse">
          <thead className="bg-wt-surface-2 text-wt-text-muted">
            <tr>
              <th className="text-left px-2 py-2 font-medium min-w-[120px]">Project</th>
              <th className="text-left px-2 py-2 font-medium min-w-[108px]">Task Category</th>
              <th className="text-left px-2 py-2 font-medium min-w-[120px]">Sub category</th>
              <th className="text-left px-2 py-2 font-medium min-w-[200px]">Description</th>
              {dayDates.map((d, i) => (
                <TableHead key={dayKeys[i]} className="text-center px-1 py-2 min-w-[2.75rem] w-11 whitespace-nowrap">
                  {formatDayHeader(d)}
                </TableHead>
              ))}
              <TableHead className="text-center px-2 py-2 min-w-[3rem]">Total</TableHead>
              {readOnly && onRowClick ? <TableHead className="text-center px-2 py-2 min-w-[4rem]">Actions</TableHead> : null}
            </tr>
          </thead>
          <TableBody>
            {rows.map((row) => {
              const selectedProject = projectOptions.find(
                (p) => p.project_code.toUpperCase() === row.project_code.trim().toUpperCase()
              );
              const taskOptions =
                selectedProject?.task_categories ??
                (row.project_code
                  ? [{ value: row.task_category, label: TASK_CATEGORY_LABELS[row.task_category] ?? row.task_category }]
                  : []);
              const subOptions = row.project_code && row.task_category
                ? subCategoriesFor(row.project_code, row.task_category)
                : [];
              const total = rowTotal(row.hours_by_date, dayKeys);
              const metadataEditable = isRowMetadataEditable(row, dayKeys);

              return (
                <tr
                  key={row.clientKey}
                  className={`border-t border-wt-border align-top ${readOnly && onRowClick ? "cursor-pointer hover:bg-wt-surface-2" : ""}`}
                  onClick={() => { if (readOnly && onRowClick) onRowClick(row); }}
                >
                  {readOnly ? (
                    <>
                      <TableCell className="px-2 py-2">{projectLabel(row, projectOptions)}</TableCell>
                      <TableCell className="px-2 py-2">{taskCategoryLabel(row)}</TableCell>
                      <TableCell className="px-2 py-2">{subCategoryLabel(row)}</TableCell>
                      <TableCell className="px-2 py-2 min-w-[200px]">
                        {readOnlyText(row.comment)}
                      </TableCell>
                      {dayKeys.map((key) => (
                        <TableCell key={key} className="px-1 py-2 text-center align-top tabular-nums">
                          {formatHoursDisplay(Number(row.hours_by_date[key] ?? 0))}
                        </TableCell>
                      ))}
                    </>
                  ) : (
                    <>
                      <TableCell className="px-2 py-2">
                        <SearchableSelectCombobox
                          disabled={!metadataEditable}
                          value={row.project_code}
                          onChange={(project_code) => {
                            const opt = projectOptions.find((p) => p.project_code === project_code);
                            const firstTask = opt?.task_categories[0]?.value ?? "";
                            const subs =
                              project_code && firstTask
                                ? subCategoriesFor(project_code, firstTask)
                                : [];
                            onRowsChange(
                              updateRow(rows, row.clientKey, {
                                project_code,
                                task_category: firstTask,
                                sub_category: subs[0] ?? "",
                              })
                            );
                          }}
                          options={projectOptions.map((p) => ({
                            value: p.project_code,
                            label: p.project_name,
                          }))}
                          placeholder="Search projects…"
                          inputClassName="input-field w-full px-2 py-1.5 text-sm"
                          showChevron
                        />
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        <SearchableSelectCombobox
                          disabled={!metadataEditable || !row.project_code}
                          value={row.task_category}
                          onChange={(task_category) => {
                            const subs =
                              row.project_code && task_category
                                ? subCategoriesFor(row.project_code, task_category)
                                : [];
                            onRowsChange(
                              updateRow(rows, row.clientKey, {
                                task_category,
                                sub_category: subs[0] ?? "",
                              })
                            );
                          }}
                          options={taskOptions}
                          placeholder="Search tasks…"
                          inputClassName="input-field w-full px-2 py-1.5 text-sm"
                          showChevron
                        />
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        {subOptions.length ? (
                          <SearchableSelectCombobox
                            disabled={!metadataEditable || !row.task_category}
                            value={row.sub_category}
                            onChange={(sub_category) =>
                              onRowsChange(updateRow(rows, row.clientKey, { sub_category }))
                            }
                            options={subOptions.map((value) => ({ value, label: value }))}
                            placeholder={
                              subCategoryRequired(row.project_code, row.task_category)
                                ? "Search sub categories…"
                                : "—"
                            }
                            inputClassName="input-field w-full px-2 py-1.5 text-sm"
                            showChevron
                          />
                        ) : (
                          <span className="text-wt-text-muted text-xs py-2 block">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-2 min-w-[200px]">
                        <input
                          className="input-field w-full min-w-[180px] px-2 py-1.5 text-sm"
                          disabled={!metadataEditable}
                          value={row.comment}
                          onChange={(e) =>
                            onRowsChange(updateRow(rows, row.clientKey, { comment: e.target.value }))
                          }
                          placeholder="Description"
                          aria-label="Description"
                        />
                      </TableCell>
                      {dayKeys.map((key) => {
                        const cellStatus = row.status_by_date?.[key];
                        const cellEditable = isTimelogCellEditable(cellStatus);
                        return (
                          <TableCell key={key} className="px-1 py-2 text-center align-top">
                            <input
                              type="text"
                              inputMode="decimal"
                              disabled={!cellEditable}
                              className="input-field w-11 max-w-[2.75rem] mx-auto px-0.5 py-1.5 text-xs text-center tabular-nums disabled:opacity-60"
                              value={row.hours_by_date[key] ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw !== "" && !/^\d*\.?\d{0,2}$/.test(raw)) return;
                                const hours_by_date = { ...row.hours_by_date, [key]: raw };
                                onRowsChange(updateRow(rows, row.clientKey, { hours_by_date }));
                              }}
                            />
                          </TableCell>
                        );
                      })}
                    </>
                  )}
                    <TableCell className="px-2 py-2 text-center whitespace-nowrap tabular-nums">
                    {formatHoursDisplay(total)}
                  </TableCell>
                  {readOnly && onRowClick ? (
                    <TableCell className="px-2 py-2 text-center align-top">
                      <Button
                        variant="outline"
                        size="xs"
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRowClick(row); }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  ) : null}
                </tr>
              );
            })}
          </TableBody>
          <tfoot>
            <TableRow className="border-t-2 bg-wt-surface-1 font-medium">
              <TableCell colSpan={4} className="px-2 py-2 text-right">
                Daily totals
              </TableCell>
              {dayKeys.map((key) => {
                const total = totals[key] ?? 0;
                return (
                  <TableCell
                    key={key}
                    className={`px-2 py-2 text-center tabular-nums ${dailyHourHighlightClass(
                      dailyHourHighlight(total)
                    )}`}
                  >
                    {formatHoursDisplay(total)}
                  </TableCell>
                );
              })}
              <TableCell className="px-2 py-2 text-center tabular-nums">{formatHoursDisplay(weekSum)}</TableCell>
              {readOnly && onRowClick ? <TableCell className="px-2 py-2" /> : null}
            </TableRow>
            {canApprove ? (
              <TableRow className="bg-wt-surface-1">
                <TableCell colSpan={4} className="px-2 py-2 text-right">
                  Day actions
                </TableCell>
                {dayKeys.map((key) => {
                  const showActions = dayHasSubmittedEntries(rows, key);
                  return (
                    <TableCell key={key} className="px-1 py-2 text-center align-top">
                      {showActions ? (
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="border-emerald-300 px-1 py-0.5 text-[10px] text-emerald-700 hover:bg-emerald-50"
                            onClick={() => onApproveDay?.(key)}
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="xs"
                            className="px-1 py-0.5 text-[10px]"
                            onClick={() => onRejectDay?.(key)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-wt-text-muted">—</span>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="px-2 py-2" />
              </TableRow>
            ) : null}
          </tfoot>
        </table>
      </div>
      {!readOnly ? (
        <Button variant="outline" size="sm" type="button" className="px-3 py-1.5 text-sm border border-wt-border rounded-lg" onClick={addRow}>
          Add row
        </Button>
      ) : null}
    </div>
  );
}

export type { TimelogOptionsPayload };
