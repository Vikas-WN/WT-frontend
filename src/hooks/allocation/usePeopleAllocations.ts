"use client";

import { useMemo, useState } from "react";

import {
  EMPTY_PEOPLE_ALLOCATION_FILTERS,
  buildPeopleAllocationRows,
  clientFilterOptions,
  filterPeopleAllocations,
  projectFilterOptions,
  sortByEndDate,
  type PeopleAllocationFilters,
} from "@/utils/peopleAllocations";

/** The People allocations list: every allocation as one row, narrowed by the filters. The data itself comes from the page's queries. */
export function usePeopleAllocations(allocations: readonly Record<string, unknown>[], projects: readonly Record<string, unknown>[]) {
  // UI state: the filter the person has chosen; the records stay in the parent's query.
  const [filters, setFilters] = useState<PeopleAllocationFilters>(EMPTY_PEOPLE_ALLOCATION_FILTERS);
  const rows = useMemo(() => buildPeopleAllocationRows(allocations, projects), [allocations, projects]);
  const visible = useMemo(() => sortByEndDate(filterPeopleAllocations(rows, filters)), [rows, filters]);
  const projectOptions = useMemo(() => projectFilterOptions(rows), [rows]);
  const clientOptions = useMemo(() => clientFilterOptions(rows), [rows]);
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(EMPTY_PEOPLE_ALLOCATION_FILTERS);
  return {
    filters,
    setFilter: <K extends keyof PeopleAllocationFilters>(key: K, value: PeopleAllocationFilters[K]) => setFilters((prev) => ({ ...prev, [key]: value })),
    clear: () => setFilters(EMPTY_PEOPLE_ALLOCATION_FILTERS),
    isFiltered,
    total: rows.length,
    rows: visible,
    projectOptions,
    clientOptions,
  };
}
