"use client";

import { useRef } from "react";
import Link from "next/link";

import { HomeUpdateSlide } from "@/components/dashboard/home/HomeUpdateSlide";
import { HOME_UPDATES, HOME_UPDATES_COPY as COPY } from "@/constants/homeUpdates";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { useHomeUpdates } from "@/hooks/dashboard/useHomeUpdates";
import { useAutoScroll } from "@/hooks/useAutoScroll";

/**
 * A strip right under the greeting with what needs attention — forms to fill, upcoming events, new announcements.
 * It drifts sideways by itself, stops when you hover or touch it, and can be scrolled by hand. Hidden when empty.
 */
export function HomeUpdatesGallery() {
  const updates = useHomeUpdates();
  const trackRef = useRef<HTMLDivElement>(null);
  const items = updates.data ?? [];
  useAutoScroll(trackRef, {
    enabled: items.length > 1,
    speedPxPerSecond: HOME_UPDATES.speedPxPerSecond,
    endPauseMs: HOME_UPDATES.endPauseMs,
  });

  if (items.length === 0) return null;

  return (
    <section aria-label={COPY.label} className="min-w-0 shrink-0">
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-wt-text-muted">{COPY.label}</h2>
        <Link href={DASHBOARD_ROUTES.announcements} className="text-xs font-medium text-[var(--wt-brand)] hover:underline">
          {COPY.seeAll}
        </Link>
      </div>
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        role="list"
      >
        {items.map((update) => (
          <div key={update.key} role="listitem" className="h-[7.25rem] w-[17.5rem] shrink-0 [@media(max-height:780px)]:h-[5.75rem] [@media(max-height:780px)]:w-[15rem]">
            <HomeUpdateSlide update={update} />
          </div>
        ))}
      </div>
    </section>
  );
}
