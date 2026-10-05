"use client";

import { useState, type ReactNode } from "react";

import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { SearchInput } from "@/components/dashboard/ui/SearchInput";

const DEFAULT_PAGE_SIZE = 10;
/** Below this many rows a search box is just clutter. */
const SEARCH_MIN_ROWS = 8;

/**
 * Pages (and, for longer lists, searches) a list that is already in memory — the people in a poll or a form's
 * responses. `matches` decides whether a row fits the search text.
 */
export function PagedList<T>({
  items,
  matches,
  renderItem,
  empty,
  idPrefix,
  searchPlaceholder = "Search people",
  pageSize = DEFAULT_PAGE_SIZE,
  wrap,
}: {
  items: T[];
  matches: (item: T, needle: string) => boolean;
  renderItem: (item: T) => ReactNode;
  empty: ReactNode;
  idPrefix: string;
  searchPlaceholder?: string;
  pageSize?: number;
  /** Wraps the rendered rows (e.g. in a `<ul>`). */
  wrap?: (rows: ReactNode) => ReactNode;
}) {
  // UI-only: the search text and which page of the filtered rows is showing.
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const needle = search.trim().toLowerCase();
  const filtered = needle ? items.filter((item) => matches(item, needle)) : items;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages - 1);
  const rows = filtered.slice(current * pageSize, (current + 1) * pageSize);
  const body = rows.map(renderItem);

  if (items.length === 0) return <>{empty}</>;

  return (
    <div className="space-y-2">
      {items.length >= SEARCH_MIN_ROWS ? (
        <SearchInput
          id={`${idPrefix}-search`}
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(0);
          }}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-9"
        />
      ) : null}
      {rows.length === 0 ? <p className="px-1 py-2 text-sm text-wt-text-muted">No one matches “{search.trim()}”.</p> : wrap ? wrap(body) : body}
      <ListPagination
        page={current}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={pageSize}
        rangeStart={current * pageSize + 1}
        rangeEnd={Math.min((current + 1) * pageSize, filtered.length)}
        onPageChange={setPage}
        className="!mt-1"
      />
    </div>
  );
}
