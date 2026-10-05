"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { EventAttendeesDialog } from "@/components/dashboard/events/EventAttendeesDialog";
import { EventCard } from "@/components/dashboard/events/EventCard";
import { EventComposerDialog } from "@/components/dashboard/events/EventComposerDialog";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ManagementListContent } from "@/components/dashboard/ui/ManagementListCard";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { PageTabs } from "@/components/dashboard/ui/PageTabs";
import { Button } from "@/components/ui/button";
import { SlideGallery } from "@/components/ui/SlideGallery";
import { ANNOUNCEMENT_POSTER_ROLES } from "@/constants/announcements";
import { EVENT_COPY } from "@/constants/events";
import { useAuth } from "@/context/AuthContext";
import { useEvents, useRsvp, useUpdateEvent } from "@/hooks/events/useEvents";
import type { AppEvent } from "@/types/event";

type Tab = "upcoming" | "organising";

export function EventsPageClient() {
  const { user } = useAuth();
  const canCreate = ANNOUNCEMENT_POSTER_ROLES.some((role) => (user?.roles ?? []).includes(role));
  const focusedId = Number(useSearchParams().get("eventId")) || null;

  const [tab, setTab] = useState<Tab>("upcoming");
  const [composing, setComposing] = useState(false);
  const [viewing, setViewing] = useState<AppEvent | null>(null);

  const events = useEvents();
  const rsvp = useRsvp();
  const update = useUpdateEvent();
  const all = useMemo(() => events.data ?? [], [events.data]);
  const organising = all.filter((event) => event.can_manage);

  const scrolledTo = useRef<number | null>(null);
  useEffect(() => {
    if (!focusedId || scrolledTo.current === focusedId || !all.some((event) => event.id === focusedId)) return;
    scrolledTo.current = focusedId;
    document.getElementById(`event-${focusedId}`)?.scrollIntoView({ inline: "center", block: "center", behavior: "smooth" });
  }, [focusedId, all]);

  const onRsvp = (id: number, response: Parameters<typeof rsvp.mutate>[0]["response"]) => rsvp.mutate({ id, response });

  return (
    <DashboardPageShell>
      <PageHero
        title={EVENT_COPY.pageTitle}
        description={EVENT_COPY.pageDescription}
        action={
          canCreate ? (
            <Button type="button" variant="brand" onClick={() => setComposing(true)}>
              <Plus className="size-4" /> {EVENT_COPY.create}
            </Button>
          ) : undefined
        }
      />
      {canCreate ? (
        <PageTabs
          value={tab}
          onValueChange={(value) => setTab(value as Tab)}
          items={[
            { value: "upcoming", label: EVENT_COPY.tabUpcoming },
            { value: "organising", label: EVENT_COPY.tabOrganising },
          ]}
        />
      ) : null}

      {tab === "organising" && canCreate ? (
        <ManagementListContent
          isLoading={events.isLoading}
          isEmpty={organising.length === 0}
          emptyTitle={EVENT_COPY.emptyOrganisingTitle}
          emptyDescription={EVENT_COPY.emptyOrganisingDescription}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {organising.map((event) => (
              <div key={event.id} className="space-y-2">
                <EventCard event={event} busy={rsvp.isPending} onRsvp={onRsvp} onManage={setViewing} />
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
              </div>
            ))}
          </div>
        </ManagementListContent>
      ) : (
        <ManagementListContent
          isLoading={events.isLoading}
          isEmpty={all.length === 0}
          emptyTitle={EVENT_COPY.emptyUpcomingTitle}
          emptyDescription={EVENT_COPY.emptyUpcomingDescription}
        >
          <SlideGallery label={EVENT_COPY.tabUpcoming} slideClassName="w-[min(88%,21rem)]">
            {all.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                busy={rsvp.isPending}
                highlighted={event.id === focusedId}
                onRsvp={onRsvp}
                onManage={setViewing}
              />
            ))}
          </SlideGallery>
        </ManagementListContent>
      )}

      {composing ? <EventComposerDialog onClose={() => setComposing(false)} /> : null}
      {viewing ? <EventAttendeesDialog event={viewing} onClose={() => setViewing(null)} /> : null}
    </DashboardPageShell>
  );
}
