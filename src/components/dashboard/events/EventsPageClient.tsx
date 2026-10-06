"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarSync, Plus } from "lucide-react";

import { CalendarSyncDialog } from "@/components/dashboard/calendar/CalendarSyncDialog";
import { EventAttendeesDialog } from "@/components/dashboard/events/EventAttendeesDialog";
import { EventCard } from "@/components/dashboard/events/EventCard";
import { EventComposerDialog } from "@/components/dashboard/events/EventComposerDialog";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ListFilters } from "@/components/dashboard/ui/ListFilters";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { ManagementListContent } from "@/components/dashboard/ui/ManagementListCard";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { PageTabs, type PageTabItem } from "@/components/dashboard/ui/PageTabs";
import { Button } from "@/components/ui/button";
import { ANNOUNCEMENT_POSTER_ROLES } from "@/constants/announcements";
import { CALENDAR_COPY } from "@/constants/calendar";
import { LIST_FILTER_COPY } from "@/constants/contentCategories";
import { EVENT_COPY, EVENT_TYPE_OPTIONS } from "@/constants/events";
import { useAuth } from "@/context/AuthContext";
import { useEvents, useRsvp, useUpdateEvent } from "@/hooks/events/useEvents";
import { useListFilters } from "@/hooks/useListFilters";
import type { AppEvent } from "@/types/event";

type Tab = "upcoming" | "past" | "organising";

export function EventsPageClient() {
  const { user } = useAuth();
  const canCreate = ANNOUNCEMENT_POSTER_ROLES.some((role) => (user?.roles ?? []).includes(role));
  const focusedId = Number(useSearchParams().get("eventId")) || null;

  const [tab, setTab] = useState<Tab>("upcoming");
  const [composing, setComposing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [viewing, setViewing] = useState<AppEvent | null>(null);
  // UI-only: leave the single-event view that a notification link opens.
  const [showAll, setShowAll] = useState(false);
  const filters = useListFilters();
  const linked = focusedId !== null && !showAll;

  const { q, category, page, size } = filters.params;
  const events = useEvents(
    linked
      ? { id: focusedId }
      : { q, eventType: category, page, size, includePast: tab === "past", organising: tab === "organising" }
  );
  const rsvp = useRsvp();
  const update = useUpdateEvent();
  const items = events.data?.items ?? [];
  const paging = events.data;
  const filtered = filters.active && !linked;

  const changeTab = (next: Tab) => {
    setTab(next);
    setShowAll(true);
    filters.clear();
  };
  const onRsvp = (id: number, response: Parameters<typeof rsvp.mutate>[0]["response"]) => rsvp.mutate({ id, response });

  const tabs: PageTabItem[] = [
    { value: "upcoming", label: EVENT_COPY.tabUpcoming },
    { value: "past", label: EVENT_COPY.tabPast },
    ...(canCreate ? [{ value: "organising", label: EVENT_COPY.tabOrganising }] : []),
  ];
  const empty =
    tab === "organising"
      ? { title: EVENT_COPY.emptyOrganisingTitle, description: EVENT_COPY.emptyOrganisingDescription }
      : tab === "past"
        ? { title: EVENT_COPY.emptyPastTitle, description: EVENT_COPY.emptyPastDescription }
        : { title: EVENT_COPY.emptyUpcomingTitle, description: EVENT_COPY.emptyUpcomingDescription };

  return (
    <DashboardPageShell>
      <PageHero
        title={EVENT_COPY.pageTitle}
        description={EVENT_COPY.pageDescription}
        action={
          <>
            <Button type="button" variant="outline" onClick={() => setSyncing(true)}>
              <CalendarSync className="size-4" /> {CALENDAR_COPY.syncButton}
            </Button>
            {canCreate ? (
              <Button type="button" variant="brand" onClick={() => setComposing(true)}>
                <Plus className="size-4" /> {EVENT_COPY.create}
              </Button>
            ) : null}
          </>
        }
      />
      <PageTabs value={tab} onValueChange={(value) => changeTab(value as Tab)} items={tabs} />

      {linked ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-2 px-4 py-2.5 text-sm text-wt-text-muted">
          <span>{EVENT_COPY.linkedNotice}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => setShowAll(true)}>
            {EVENT_COPY.showAll}
          </Button>
        </div>
      ) : (
        <ListFilters
          idPrefix="events"
          search={filters.search}
          onSearch={filters.setSearch}
          placeholder={EVENT_COPY.searchPlaceholder}
          chips={EVENT_TYPE_OPTIONS}
          chipValue={filters.category}
          onChip={filters.setCategory}
        />
      )}

      <ManagementListContent
        isLoading={events.isLoading}
        isEmpty={items.length === 0}
        emptyTitle={filtered ? LIST_FILTER_COPY.noMatchesTitle : empty.title}
        emptyDescription={filtered ? LIST_FILTER_COPY.noMatchesDescription : empty.description}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((event) => (
            <div key={event.id} id={`event-${event.id}`} className="space-y-2">
              <EventCard
                event={event}
                busy={rsvp.isPending}
                highlighted={event.id === focusedId}
                onRsvp={onRsvp}
                onManage={setViewing}
              />
              {tab === "organising" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full text-wt-text-muted"
                  disabled={update.isPending}
                  onClick={() => update.mutate({ id: event.id, payload: { is_cancelled: !event.is_cancelled } })}
                >
                  {event.is_cancelled ? EVENT_COPY.restoreEvent : EVENT_COPY.cancelEvent}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </ManagementListContent>

      {paging && !linked ? (
        <ListPagination
          page={paging.current_page}
          totalPages={paging.total_pages}
          totalItems={paging.total_elements}
          pageSize={paging.page_size}
          rangeStart={paging.current_page * paging.page_size + 1}
          rangeEnd={Math.min((paging.current_page + 1) * paging.page_size, paging.total_elements)}
          onPageChange={filters.setPage}
          loading={events.isFetching}
        />
      ) : null}

      {syncing ? <CalendarSyncDialog onClose={() => setSyncing(false)} /> : null}
      {composing ? <EventComposerDialog onClose={() => setComposing(false)} /> : null}
      {viewing ? <EventAttendeesDialog event={viewing} onClose={() => setViewing(null)} /> : null}
    </DashboardPageShell>
  );
}
