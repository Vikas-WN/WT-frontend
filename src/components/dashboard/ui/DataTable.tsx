"use client";

import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { PageSectionHeader } from "@/components/dashboard/ui/PageSectionHeader";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import { TableSortHeader } from "@/components/dashboard/ui/TableSortHeader";
import { TableBody,TableCell,TableHead,TableHeader,TableRow,WT_STICKY_TABLE_HEAD_CLASS,WtTable } from "@/components/dashboard/ui/wtTable";
import { RecordList, RecordValue } from "@/components/dashboard/ui/RecordList";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { useWorkspaceTable } from "@/hooks/useWorkspaceTable";
import { activeSortDirectionForColumn,sortOptionsForColumn,toggleColumnSort } from "@/utils/listSort";
import { formatTableColumnHeader } from "@/utils/tableDisplay";
import type { WorkspaceTableProps } from "@/types/workspaceTable";
import { cn } from "@/lib/utils";

/** One data view: sortable table on desktop, complete records on phones. */
export function DataTable(props: WorkspaceTableProps) {
  const view=useWorkspaceTable(props);
  return <div className={cn("wt-data-view space-y-4",props.compact&&"wt-data-compact")}>
    {props.title?<PageSectionHeader title={props.title} titleAs="h4"/>:null}
    {view.total===0?<EmptyState title={props.emptyLabel} description="Records will appear here when available."/>:<>
      {view.compactViewport ? <div className="wt-record-mobile">
        {props.sortOptions?.length?<label className="mb-3 flex items-center justify-between gap-3 text-xs text-wt-text-muted">Sort by<select aria-label="Sort records" value={view.sortId} onChange={(event)=>view.setSortId(event.target.value)} className="h-10 max-w-[70%] rounded-lg border border-wt-border bg-wt-surface-1 px-3 text-wt-text">{props.sortOptions.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select></label>:null}
        <RecordList columns={view.columns} rows={view.rows}/>
      </div> : <div className="wt-record-desktop"><ScrollableTable maxHeightClass={props.maxHeightClass} scrollChain={props.scrollChain??true}>
        <WtTable><TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}><TableRow>{view.columns.map(column=>{
          const sorts=props.sortOptions?.length?sortOptionsForColumn(column,props.sortOptions):[];
          const direction=props.sortOptions?.length&&sorts.length?activeSortDirectionForColumn(column,view.sortId,props.sortOptions):null;
          return <TableHead key={column}><TableSortHeader label={formatTableColumnHeader(column)} activeDirection={direction} sortable={sorts.length>0} onSort={sorts.length&&props.sortOptions?()=>view.setSortId(toggleColumnSort(column,view.sortId,props.sortOptions!)):undefined}/></TableHead>;
        })}</TableRow></TableHeader><TableBody>{view.rows.map((row,index)=><TableRow key={String(row.id??row.emp_id??index)}>{view.columns.map(column=><TableCell key={column}><RecordValue column={column} value={row[column]}/></TableCell>)}</TableRow>)}</TableBody></WtTable>
      </ScrollableTable></div>}
      {props.paginate!==false&&(view.total>(props.pageSize??10)||view.pagination.pageSize>(props.pageSize??10))?<div className="wt-data-pagination"><ListPagination page={view.pagination.page} totalPages={view.pagination.totalPages} totalItems={view.total} rangeStart={view.pagination.rangeStart} rangeEnd={view.pagination.rangeEnd} pageSize={view.pagination.pageSize} onPageChange={view.pagination.setPage} onPageSizeChange={view.pagination.setPageSize}/></div>:null}
    </>}
  </div>;
}
