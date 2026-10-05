"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Megaphone, Plus } from "lucide-react";

import { AnnouncementCard } from "@/components/dashboard/announcements/AnnouncementCard";
import { AnnouncementComposerDialog } from "@/components/dashboard/announcements/AnnouncementComposerDialog";
import { PostedAnnouncementCard } from "@/components/dashboard/announcements/PostedAnnouncementCard";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ListFilters } from "@/components/dashboard/ui/ListFilters";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { ManagementListContent } from "@/components/dashboard/ui/ManagementListCard";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { PageTabs, type PageTabItem } from "@/components/dashboard/ui/PageTabs";
import { Button } from "@/components/ui/button";
import { ANNOUNCEMENT_COPY, ANNOUNCEMENT_POSTER_ROLES } from "@/constants/announcements";
import { ANNOUNCEMENT_CATEGORY_OPTIONS, LIST_FILTER_COPY } from "@/constants/contentCategories";
import { useAuth } from "@/context/AuthContext";
import {
  useAnnouncementsFeed,
  useManagedAnnouncements,
  useMarkAnnouncementRead,
  useUnreadAnnouncements,
  useUpdateAnnouncement,
} from "@/hooks/announcements/useAnnouncements";
import { useListFilters } from "@/hooks/useListFilters";

type Tab = "feed" | "posted";

export function AnnouncementsPageClient() {
  const { user } = useAuth();
  const canPost = ANNOUNCEMENT_POSTER_ROLES.some((role) => (user?.roles ?? []).includes(role));
  const focusedId = Number(useSearchParams().get("announcementId")) || null;

  const [tab, setTab] = useState<Tab>("feed");
  const [composing, setComposing] = useState(false);
  // UI-only: leave the single-announcement view that a notification link opens.
  const [showAll, setShowAll] = useState(false);
  const filters = useListFilters();
  const linked = focusedId !== null && !showAll;
  const params = linked ? { id: focusedId } : filters.params;

  const feed = useAnnouncementsFeed(params);
  const posted = useManagedAnnouncements(canPost && tab === "posted", filters.params);
  const unread = useUnreadAnnouncements();
  const markRead = useMarkAnnouncementRead();
  const update = useUpdateAnnouncement();

  const items = useMemo(() => feed.data?.items ?? [], [feed.data]);
  const postedItems = posted.data?.items ?? [];
  const unreadCount = unread.data ?? 0;

  // Arriving from a notification: mark the announcement it points at as read, once.
  const handledDeepLink = useRef<number | null>(null);
  useEffect(() => {
    if (!focusedId || handledDeepLink.current === focusedId) return;
    const target = items.find((item) => item.id === focusedId);
    if (!target) return;
    handledDeepLink.current = focusedId;
    if (!target.is_read) markRead.mutate(focusedId);
  }, [focusedId, items, markRead]);

  const changeTab = (next: Tab) => {
    setTab(next);
    setShowAll(true);
    filters.clear();
  };

  const tabs: PageTabItem[] = canPost
    ? [
        { value: "feed", label: unreadCount > 0 ? `${ANNOUNCEMENT_COPY.tabFeed} (${unreadCount})` : ANNOUNCEMENT_COPY.tabFeed },
        { value: "posted", label: ANNOUNCEMENT_COPY.tabPosted },
      ]
    : [];

  const active = tab === "posted" && canPost ? posted : feed;
  const page = active.data;
  const emptyFiltered = filters.active && !linked;

  return (
    <DashboardPageShell>
      <PageHero
        title={ANNOUNCEMENT_COPY.pageTitle}
        description={ANNOUNCEMENT_COPY.pageDescription}
        action={
          canPost ? (
            <Button type="button" variant="brand" onClick={() => setComposing(true)}>
              <Plus className="size-4" /> {ANNOUNCEMENT_COPY.compose}
            </Button>
          ) : undefined
        }
      />
      {tabs.length > 0 ? <PageTabs value={tab} onValueChange={(value) => changeTab(value as Tab)} items={tabs} /> : null}

      {linked ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-2 px-4 py-2.5 text-sm text-wt-text-muted">
          <span>{ANNOUNCEMENT_COPY.linkedNotice}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => setShowAll(true)}>
            {ANNOUNCEMENT_COPY.showAll}
          </Button>
        </div>
      ) : (
        <ListFilters
          idPrefix="announcements"
          search={filters.search}
          onSearch={filters.setSearch}
          placeholder={ANNOUNCEMENT_COPY.searchPlaceholder}
          chips={ANNOUNCEMENT_CATEGORY_OPTIONS}
          chipValue={filters.category}
          onChip={filters.setCategory}
        />
      )}

      {tab === "posted" && canPost ? (
        <ManagementListContent
          isLoading={posted.isLoading}
          isEmpty={postedItems.length === 0}
          emptyTitle={emptyFiltered ? LIST_FILTER_COPY.noMatchesTitle : ANNOUNCEMENT_COPY.emptyPostedTitle}
          emptyDescription={emptyFiltered ? LIST_FILTER_COPY.noMatchesDescription : ANNOUNCEMENT_COPY.emptyPostedDescription}
        >
          <div className="space-y-3">
            {postedItems.map((announcement) => (
              <PostedAnnouncementCard
                key={announcement.id}
                announcement={announcement}
                busy={update.isPending}
                onUpdate={(id, payload) => update.mutate({ id, payload })}
              />
            ))}
          </div>
        </ManagementListContent>
      ) : (
        <ManagementListContent
          isLoading={feed.isLoading}
          isEmpty={items.length === 0}
          emptyTitle={emptyFiltered ? LIST_FILTER_COPY.noMatchesTitle : ANNOUNCEMENT_COPY.emptyFeedTitle}
          emptyDescription={emptyFiltered ? LIST_FILTER_COPY.noMatchesDescription : ANNOUNCEMENT_COPY.emptyFeedDescription}
        >
          <div className="space-y-3">
            {items.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                highlighted={announcement.id === focusedId}
                onOpen={(item) => markRead.mutate(item.id)}
              />
            ))}
            {items.length > 0 && !linked ? (
              <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-wt-text-faint">
                <Megaphone className="size-3.5" aria-hidden /> {ANNOUNCEMENT_COPY.markAllHint}
              </p>
            ) : null}
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

      {composing ? <AnnouncementComposerDialog onClose={() => setComposing(false)} /> : null}
    </DashboardPageShell>
  );
}
