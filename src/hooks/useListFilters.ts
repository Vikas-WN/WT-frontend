"use client";

import { useState } from "react";

import { LIST_PAGE_SIZE, LIST_SEARCH_DELAY_MS } from "@/constants/contentCategories";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

/**
 * Search text, a category and the current page for a paged list. Changing the search or category jumps back to the
 * first page; `params` carries the debounced search so typing doesn't fire a request per keystroke.
 */
export function useListFilters() {
  // UI-only state: what the person has typed/picked, before it becomes query params.
  const [search, setSearchRaw] = useState("");
  const [category, setCategoryRaw] = useState("");
  const [page, setPage] = useState(0);
  const debounced = useDebouncedValue(search.trim(), LIST_SEARCH_DELAY_MS);

  return {
    search,
    category,
    page,
    setPage,
    setSearch: (value: string) => {
      setSearchRaw(value);
      setPage(0);
    },
    setCategory: (value: string) => {
      setCategoryRaw(value);
      setPage(0);
    },
    clear: () => {
      setSearchRaw("");
      setCategoryRaw("");
      setPage(0);
    },
    active: search.trim() !== "" || category !== "",
    params: { q: debounced, category, page, size: LIST_PAGE_SIZE },
  };
}
