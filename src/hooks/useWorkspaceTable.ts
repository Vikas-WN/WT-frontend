"use client";
import { useMemo, useState } from "react";
import { useCompactViewport } from "@/hooks/useCompactViewport";
import { useClientPagination } from "@/hooks/useClientPagination";
import { applyListSort } from "@/utils/listSort";
import { prepareTableForDisplay } from "@/utils/tableDisplay";
import type { WorkspaceTableProps } from "@/types/workspaceTable";

export function useWorkspaceTable(props: WorkspaceTableProps) {
  const compactViewport=useCompactViewport();
  // UI-only sort selection; server records stay in the parent query.
  const [chosenSort,setChosenSort] = useState(()=>props.defaultSortId??props.sortOptions?.[0]?.id??"");
  const sortId=props.sortId??chosenSort;
  const setSortId=props.onSortIdChange??setChosenSort;
  const prepared=useMemo(()=>prepareTableForDisplay(props.columns,props.rows.map(row=>({...row}))),[props.columns,props.rows]);
  const sorted=useMemo(()=>props.sortOptions?.length?applyListSort(prepared.rows,sortId,props.sortOptions):prepared.rows,[prepared.rows,sortId,props.sortOptions]);
  const pagination=useClientPagination(sorted,{pageSize:props.pageSize,resetKeys:props.resetPaginationKeys??[sortId]});
  return {compactViewport,columns:prepared.columns,rows:props.paginate===false?sorted:pagination.pageItems,total:sorted.length,sortId,setSortId,pagination};
}
