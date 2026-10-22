import type { ReactNode } from "react";
import type { ListSortOption } from "@/utils/listSort";

export type WorkspaceRecord = Record<string, unknown | ReactNode>;
export type WorkspaceTableProps = {
  title?: string;
  columns: string[];
  rows: WorkspaceRecord[];
  emptyLabel: string;
  compact?: boolean;
  sortOptions?: ListSortOption<Record<string, unknown>>[];
  defaultSortId?: string;
  sortId?: string;
  onSortIdChange?: (sortId: string) => void;
  paginate?: boolean;
  pageSize?: number;
  resetPaginationKeys?: readonly unknown[];
  maxHeightClass?: string;
  scrollChain?: boolean;
};
export type RecordListProps = { columns: string[]; rows: WorkspaceRecord[] };
