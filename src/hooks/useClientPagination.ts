"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

type Options = {
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  /** When any value changes, reset to page 0 (e.g. search query, sort id). */
  resetKeys?: readonly unknown[];
};

export function useClientPagination<T>(items: readonly T[], options?: Options) {
  const pageSizeOptions = options?.pageSizeOptions ?? PAGE_SIZE_OPTIONS;
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(options?.pageSize ?? DEFAULT_PAGE_SIZE);

  const totalPagesRef = useRef(1);

  const resetSignature =
    options?.resetKeys?.map((key) => String(key)).join("\u0000") ?? "";

  // Reset to the first page only when the *view* changes (search / filters / sort,
  // via resetKeys, or page size). Do NOT key off items.length — removing a row
  // (e.g. deleting an employee) would otherwise bounce the user back to page 1.
  // A page that no longer exists after the list shrinks is handled by the
  // safePage clamp below, which snaps to the new last page instead.
  useEffect(() => {
    setPage(0);
  }, [pageSize, resetSignature]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  totalPagesRef.current = totalPages;

  const safePage = Math.min(page, Math.max(0, totalPages - 1));

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const pageItems = useMemo(() => {
    const start = safePage * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const rangeStart = totalItems === 0 ? 0 : safePage * pageSize + 1;
  const rangeEnd = Math.min(totalItems, (safePage + 1) * pageSize);

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    pageItems,
    totalItems,
    totalPages,
    rangeStart,
    rangeEnd,
    pageSizeOptions,
    showPagination: totalItems > 0,
  };
}
