"use client";

import { useMemo, useState } from "react";
import { SegmentedTabs } from "@/components/dashboard/ui/SegmentedTabs";
import { ALLOCATION_HISTORY_COPY, ALLOCATION_VIEW_OPTIONS } from "@/constants/allocationHistory";
import { isListedAllocationRow, withTalentPoolLabel, type AllocationListView } from "@/utils/allocationList";

import { DataTable } from "@/components/dashboard/ui/DataTable";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { DatePicker } from "@/components/ui/date-picker";
import { SelectField } from "@/components/dashboard/ui/forms";
import { SearchInput } from "@/components/dashboard/ui/SearchInput";
import { Button } from "@/components/ui/button";
import { ALL_FILTER, PEOPLE_ALLOCATIONS_COPY as COPY, PEOPLE_ALLOCATION_COLUMNS, PEOPLE_ALLOCATION_STATUS_FILTER_OPTIONS, PEOPLE_ALLOCATION_TYPE_FILTER_OPTIONS } from "@/constants/peopleAllocations";
import { usePeopleAllocations } from "@/hooks/allocation/usePeopleAllocations";
import { cn } from "@/lib/utils";

/** Every employee allocation in one list, with End date, Status, Allocation type, Project and Client filters. */
export function PeopleAllocationsPanel({
  allocations,
  projects,
  loading,
  error,
}: {
  allocations: readonly Record<string, unknown>[];
  projects: readonly Record<string, unknown>[];
  loading: boolean;
  error: string | null;
}) {
  // Current allocations (incl. the talent pool) vs. history: ended, deallocated, and people who have left.
  const [listView, setListView] = useState<AllocationListView>("current");
  const listed = useMemo(
    () => allocations.filter((row) => isListedAllocationRow(row, listView)).map(withTalentPoolLabel),
    [allocations, listView]
  );
  const view = usePeopleAllocations(listed, projects);
  const withAll = (options: Array<{ value: string; label: string }>) => [{ value: ALL_FILTER, label: COPY.all }, ...options];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-wt-text">{COPY.title}</h3>
          <p className="text-sm text-wt-text-muted">
            {listView === "history" ? ALLOCATION_HISTORY_COPY.historyHint : null}
            {COPY.description}
          </p>
        </div>
        <SegmentedTabs
          value={listView}
          onChange={(v) => setListView(v as AllocationListView)}
          options={ALLOCATION_VIEW_OPTIONS}
          label={ALLOCATION_HISTORY_COPY.viewLabel}
        />
      </div>

      <div className="rounded-xl border border-wt-border bg-wt-surface-1 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-4">
            <SearchInput
              id="people-allocations-search"
              value={view.filters.search}
              onChange={(value) => view.setFilter("search", value)}
              placeholder={COPY.searchPlaceholder}
              aria-label={COPY.searchLabel}
            />
          </div>
          <DatePicker label={COPY.endFrom} value={view.filters.endFrom} onChange={(value) => view.setFilter("endFrom", value)} />
          <DatePicker label={COPY.endTo} value={view.filters.endTo} onChange={(value) => view.setFilter("endTo", value)} />
          <SelectField label={COPY.status} value={view.filters.status} options={PEOPLE_ALLOCATION_STATUS_FILTER_OPTIONS} onChange={(value) => view.setFilter("status", value || ALL_FILTER)} clearSelectionOnEmptyInput={false} />
          <SelectField label={COPY.type} value={view.filters.type} options={PEOPLE_ALLOCATION_TYPE_FILTER_OPTIONS} onChange={(value) => view.setFilter("type", value || ALL_FILTER)} clearSelectionOnEmptyInput={false} />
          <SelectField label={COPY.project} value={view.filters.project} options={withAll(view.projectOptions)} onChange={(value) => view.setFilter("project", value || ALL_FILTER)} clearSelectionOnEmptyInput={false} />
          <SelectField label={COPY.client} value={view.filters.client} options={withAll(view.clientOptions)} onChange={(value) => view.setFilter("client", value || ALL_FILTER)} clearSelectionOnEmptyInput={false} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm text-wt-text-muted">
          <span aria-live="polite">{COPY.count(view.rows.length, view.total)}</span>
          <Button type="button" variant="ghost" size="sm" onClick={view.clear} disabled={!view.isFiltered} className={cn(!view.isFiltered && "invisible")}>
            {COPY.clear}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading && view.total === 0 ? (
        <SectionLoading label="Loading allocations…" />
      ) : (
        <DataTable columns={[...PEOPLE_ALLOCATION_COLUMNS]} rows={view.rows.map((row) => ({ ...row }))} emptyLabel={COPY.empty} pageSize={25} resetPaginationKeys={[JSON.stringify(view.filters), listView]} />
      )}
    </div>
  );
}
