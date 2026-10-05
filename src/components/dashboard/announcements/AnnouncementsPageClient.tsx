"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Megaphone, Plus } from "lucide-react";

import { AnnouncementCard } from "@/components/dashboard/announcements/AnnouncementCard";
import { AnnouncementComposerDialog } from "@/components/dashboard/announcements/AnnouncementComposerDialog";
import { PostedAnnouncementCard } from "@/components/dashboard/announcements/PostedAnnouncementCard";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ManagementListContent } from "@/components/dashboard/ui/ManagementListCard";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { PageTabs, type PageTabItem } from "@/components/dashboard/ui/PageTabs";
import { Button } from "@/components/ui/button";
import { ANNOUNCEMENT_COPY, ANNOUNCEMENT_POSTER_ROLES } from "@/constants/announcements";
import { useAuth } from "@/context/AuthContext";
import {
  useAnnouncementsFeed,
  useManagedAnnouncements,
  useMarkAnnouncementRead,
  useUpdateAnnouncement,
} from "@/hooks/announcements/useAnnouncements";

type Tab = "feed" | "posted";

export function AnnouncementsPageClient() {
  const { user } = useAuth();
  const canPost = ANNOUNCEMENT_POSTER_ROLES.some((role) => (user?.roles ?? []).includes(role));
  const focusedId = Number(useSearchParams().get("announcementId")) || null;

  const [tab, setTab] = useState<Tab>("feed");
  const [composing, setComposing] = useState(false);

  const feed = useAnnouncementsFeed();
  const posted = useManagedAnnouncements(canPost);
  const markRead = useMarkAnnouncementRead();
  const update = useUpdateAnnouncement();

  const items = useMemo(() => feed.data ?? [], [feed.data]);
  const unread = items.filter((item) => !item.is_read).length;

  // Arriving from a notification: bring that announcement into view and mark it read, once.
  const handledDeepLink = useRef<number | null>(null);
  useEffect(() => {
    if (!focusedId || handledDeepLink.current === focusedId) return;
    const target = items.find((item) => item.id === focusedId);
    if (!target) return;
    handledDeepLink.current = focusedId;
    document.getElementById(`announcement-${focusedId}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    if (!target.is_read) markRead.mutate(focusedId);
  }, [focusedId, items, markRead]);

  const tabs: PageTabItem[] = canPost
    ? [
        { value: "feed", label: unread > 0 ? `${ANNOUNCEMENT_COPY.tabFeed} (${unread})` : ANNOUNCEMENT_COPY.tabFeed },
        { value: "posted", label: ANNOUNCEMENT_COPY.tabPosted },
      ]
    : [];

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
      {tabs.length > 0 ? <PageTabs value={tab} onValueChange={(value) => setTab(value as Tab)} items={tabs} /> : null}

      {tab === "posted" && canPost ? (
        <ManagementListContent
          isLoading={posted.isLoading}
          isEmpty={(posted.data ?? []).length === 0}
          emptyTitle={ANNOUNCEMENT_COPY.emptyPostedTitle}
          emptyDescription={ANNOUNCEMENT_COPY.emptyPostedDescription}
        >
          <div className="space-y-3">
            {(posted.data ?? []).map((announcement) => (
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
          emptyTitle={ANNOUNCEMENT_COPY.emptyFeedTitle}
          emptyDescription={ANNOUNCEMENT_COPY.emptyFeedDescription}
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
            {items.length > 0 ? (
              <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-wt-text-faint">
                <Megaphone className="size-3.5" aria-hidden /> {ANNOUNCEMENT_COPY.markAllHint}
              </p>
            ) : null}
          </div>
        </ManagementListContent>
      )}

      {composing ? <AnnouncementComposerDialog onClose={() => setComposing(false)} /> : null}
    </DashboardPageShell>
  );
}
