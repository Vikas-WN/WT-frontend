"use client";

import { useQuery } from "@tanstack/react-query";

import { HOME_UPDATES, HOME_UPDATES_QUERY_KEY } from "@/constants/homeUpdates";
import { eventService } from "@/services/events.service";
import { formService } from "@/services/forms.service";
import { announcementService } from "@/services/announcements.service";
import type { Announcement } from "@/types/announcement";
import type { AppEvent } from "@/types/event";
import type { FormSummary } from "@/types/form";

export type HomeUpdate =
  | { kind: "form"; key: string; form: FormSummary }
  | { kind: "event"; key: string; event: AppEvent }
  | { kind: "announcement"; key: string; announcement: Announcement };

/** Interleaves the lists so the strip mixes kinds instead of showing all forms, then all events… */
function interleave(forms: FormSummary[], events: AppEvent[], announcements: Announcement[]): HomeUpdate[] {
  const out: HomeUpdate[] = [];
  const longest = Math.max(forms.length, events.length, announcements.length);
  for (let i = 0; i < longest; i += 1) {
    if (forms[i]) out.push({ kind: "form", key: `form-${forms[i].id}`, form: forms[i] });
    if (announcements[i]) out.push({ kind: "announcement", key: `ann-${announcements[i].id}`, announcement: announcements[i] });
    if (events[i]) out.push({ kind: "event", key: `event-${events[i].id}`, event: events[i] });
  }
  return out;
}

/** Things waiting for you: forms to fill, upcoming events and recent announcements — one small query each. */
export function useHomeUpdates() {
  const size = HOME_UPDATES.perKind;
  return useQuery({
    queryKey: [...HOME_UPDATES_QUERY_KEY, size],
    staleTime: 30_000,
    refetchInterval: HOME_UPDATES.refreshMs,
    refetchOnWindowFocus: "always",
    queryFn: async () => {
      // One failing source shouldn't blank the whole strip.
      const [forms, events, announcements] = await Promise.allSettled([
        formService.mine({ status: "todo", size }),
        eventService.list({ size }),
        announcementService.feed({ size }),
      ]);
      const pick = <T,>(result: PromiseSettledResult<{ data?: { items: T[] } | null }>): T[] =>
        result.status === "fulfilled" ? (result.value.data?.items ?? []) : [];
      return interleave(
        pick<FormSummary>(forms),
        pick<AppEvent>(events).filter((event) => !event.is_cancelled),
        pick<Announcement>(announcements)
      );
    },
  });
}
