"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { FormBuilderDialog } from "@/components/dashboard/forms/FormBuilderDialog";
import { FormCard } from "@/components/dashboard/forms/FormCard";
import { FormFillDialog } from "@/components/dashboard/forms/FormFillDialog";
import { FormResponsesDialog } from "@/components/dashboard/forms/FormResponsesDialog";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ListFilters } from "@/components/dashboard/ui/ListFilters";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { ManagementListContent } from "@/components/dashboard/ui/ManagementListCard";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { PageTabs } from "@/components/dashboard/ui/PageTabs";
import { Button } from "@/components/ui/button";
import { ANNOUNCEMENT_POSTER_ROLES } from "@/constants/announcements";
import { FORM_CATEGORY_OPTIONS, LIST_FILTER_COPY } from "@/constants/contentCategories";
import { FORM_COPY, FORM_STATUS_OPTIONS, type FormStatusFilter } from "@/constants/forms";
import { useAuth } from "@/context/AuthContext";
import { useManagedForms, useMyForms } from "@/hooks/forms/useForms";
import { useListFilters } from "@/hooks/useListFilters";
import { cn } from "@/lib/utils";

type Tab = "to-fill" | "sent";

export function FormsPageClient() {
  const { user } = useAuth();
  const canSend = ANNOUNCEMENT_POSTER_ROLES.some((role) => (user?.roles ?? []).includes(role));
  const focusedId = Number(useSearchParams().get("formId")) || null;

  const [tab, setTab] = useState<Tab>("to-fill");
  const [building, setBuilding] = useState(false);
  const [filling, setFilling] = useState<number | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  // UI-only: to-do / done filter and leaving the single-form view a notification link opens.
  const [status, setStatus] = useState<FormStatusFilter>("all");
  const [showAll, setShowAll] = useState(false);
  const filters = useListFilters();
  const linked = focusedId !== null && !showAll;

  const mine = useMyForms(linked ? { id: focusedId } : { ...filters.params, status });
  const sent = useManagedForms(canSend && tab === "sent", filters.params);
  // Just the count for the tab badge.
  const todo = useMyForms({ status: "todo", size: 1 }).data?.total_elements ?? 0;

  // Arriving from a notification: open that form once.
  const opened = useRef<number | null>(null);
  useEffect(() => {
    if (!focusedId || opened.current === focusedId || !(mine.data?.items ?? []).some((f) => f.id === focusedId)) return;
    opened.current = focusedId;
    setFilling(focusedId);
  }, [focusedId, mine.data]);

  const changeTab = (next: Tab) => {
    setTab(next);
    setShowAll(true);
    setStatus("all");
    filters.clear();
  };

  const mineItems = mine.data?.items ?? [];
  const sentItems = sent.data?.items ?? [];
  const active = tab === "sent" && canSend ? sent : mine;
  const page = active.data;
  const filtered = (filters.active || status !== "all") && !linked;

  return (
    <DashboardPageShell>
      <PageHero
        title={FORM_COPY.pageTitle}
        description={FORM_COPY.pageDescription}
        action={
          canSend ? (
            <Button type="button" variant="brand" onClick={() => setBuilding(true)}>
              <Plus className="size-4" /> {FORM_COPY.create}
            </Button>
          ) : undefined
        }
      />
      {canSend ? (
        <PageTabs
          value={tab}
          onValueChange={(value) => changeTab(value as Tab)}
          items={[
            { value: "to-fill", label: todo > 0 ? `${FORM_COPY.tabToFill} (${todo})` : FORM_COPY.tabToFill },
            { value: "sent", label: FORM_COPY.tabSent },
          ]}
        />
      ) : null}

      {linked ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-2 px-4 py-2.5 text-sm text-wt-text-muted">
          <span>{FORM_COPY.linkedNotice}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => setShowAll(true)}>
            {FORM_COPY.showAll}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <ListFilters
            idPrefix="forms"
            search={filters.search}
            onSearch={filters.setSearch}
            placeholder={FORM_COPY.searchPlaceholder}
            chips={FORM_CATEGORY_OPTIONS}
            chipValue={filters.category}
            onChip={filters.setCategory}
          />
          {tab === "to-fill" ? (
            <div className="flex gap-1.5" role="group" aria-label="Status">
              {FORM_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={status === option.value}
                  onClick={() => {
                    setStatus(option.value);
                    filters.setPage(0);
                  }}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium",
                    status === option.value ? "bg-wt-surface-3 text-wt-text" : "text-wt-text-muted hover:text-wt-text"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {tab === "sent" && canSend ? (
        <ManagementListContent
          isLoading={sent.isLoading}
          isEmpty={sentItems.length === 0}
          emptyTitle={filtered ? LIST_FILTER_COPY.noMatchesTitle : FORM_COPY.emptySentTitle}
          emptyDescription={filtered ? LIST_FILTER_COPY.noMatchesDescription : FORM_COPY.emptySentDescription}
        >
          <div className="space-y-3">
            {sentItems.map((form) => (
              <FormCard key={form.id} form={form} mode="sent" onOpen={(f) => setViewing(f.id)} />
            ))}
          </div>
        </ManagementListContent>
      ) : (
        <ManagementListContent
          isLoading={mine.isLoading}
          isEmpty={mineItems.length === 0}
          emptyTitle={filtered ? LIST_FILTER_COPY.noMatchesTitle : FORM_COPY.emptyToFillTitle}
          emptyDescription={filtered ? LIST_FILTER_COPY.noMatchesDescription : FORM_COPY.emptyToFillDescription}
        >
          <div className="space-y-3">
            {mineItems.map((form) => (
              <FormCard key={form.id} form={form} mode="mine" highlighted={form.id === focusedId} onOpen={(f) => setFilling(f.id)} />
            ))}
          </div>
        </ManagementListContent>
      )}

      {page && !linked ? (
        <ListPagination
          page={page.current_page}
          totalPages={page.total_pages}
          totalItems={page.total_elements}
          pageSize={page.page_size}
          rangeStart={page.current_page * page.page_size + 1}
          rangeEnd={Math.min((page.current_page + 1) * page.page_size, page.total_elements)}
          onPageChange={filters.setPage}
          loading={active.isFetching}
        />
      ) : null}

      {building ? <FormBuilderDialog onClose={() => setBuilding(false)} /> : null}
      {filling != null ? <FormFillDialog formId={filling} onClose={() => setFilling(null)} /> : null}
      {viewing != null ? <FormResponsesDialog formId={viewing} onClose={() => setViewing(null)} /> : null}
    </DashboardPageShell>
  );
}
