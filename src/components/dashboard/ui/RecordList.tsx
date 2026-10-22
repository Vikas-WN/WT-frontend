import { isValidElement, type ReactNode } from "react";
import type { RecordListProps } from "@/types/workspaceTable";
import { formatTableCellValue, formatTableColumnHeader } from "@/utils/tableDisplay";

export function RecordValue({column, value}: {column: string; value: unknown}) {
  if (value == null || value === "") return <span className="text-wt-text-faint">—</span>;
  return isValidElement(value) ? value as ReactNode : <>{formatTableCellValue(column,value)}</>;
}

/** Stacked records preserve every field and action without a sideways table on phones. */
export function RecordList({columns,rows}: RecordListProps) {
  const [primary,...fields] = columns;
  return <div className="wt-record-list">
    {rows.map((row,index)=><article key={String(row.id??row.emp_id??index)} className="wt-record-card">
      <div className="wt-record-title"><RecordValue column={primary} value={row[primary]}/></div>
      {fields.length?<dl className="wt-record-fields">{fields.map((column)=><div key={column} className="min-w-0"><dt>{formatTableColumnHeader(column)}</dt><dd><RecordValue column={column} value={row[column]}/></dd></div>)}</dl>:null}
    </article>)}
  </div>;
}
