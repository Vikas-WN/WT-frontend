"use client";

import { Children, useCallback, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const EDGE_SLACK_PX = 2;
const PAGE_FRACTION = 0.9;

/**
 * A horizontal "slide gallery": cards sit side by side and snap into place as you swipe, scroll or use the
 * arrows / ← → keys. Arrows hide at the ends and dots show your place. Pass any number of children; each
 * becomes one slide, sized by `slideClassName` (default: most of the width on phones, a fixed card on desktop).
 */
export function SlideGallery({
  label,
  children,
  slideClassName = "w-[min(88%,22rem)]",
  className,
}: {
  label: string;
  children: ReactNode;
  slideClassName?: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [active, setActive] = useState(0);
  const slides = Children.toArray(children);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setAtStart(track.scrollLeft <= EDGE_SLACK_PX);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - EDGE_SLACK_PX);
    const first = track.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = first ? first.offsetWidth + gap : track.clientWidth;
    setActive(Math.min(slides.length - 1, Math.round(track.scrollLeft / Math.max(step, 1))));
  }, [slides.length]);

  // ResizeObserver fires once on observe(), which also gives the initial measurement.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure]);

  const page = (direction: 1 | -1) => {
    const track = trackRef.current;
    track?.scrollBy({ left: direction * track.clientWidth * PAGE_FRACTION, behavior: "smooth" });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      page(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      page(-1);
    }
  };

  const arrow = "absolute top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-wt-border bg-wt-surface-1 text-wt-text shadow-[var(--wt-shadow-md)] transition hover:bg-wt-surface-2 sm:flex";

  return (
    <section aria-roledescription="carousel" aria-label={label} className={cn("relative", className)}>
      {!atStart ? (
        <button type="button" aria-label="Previous" onClick={() => page(-1)} className={cn(arrow, "-left-3")}>
          <ChevronLeft className="size-4" aria-hidden />
        </button>
      ) : null}
      {!atEnd ? (
        <button type="button" aria-label="Next" onClick={() => page(1)} className={cn(arrow, "-right-3")}>
          <ChevronRight className="size-4" aria-hidden />
        </button>
      ) : null}

      <div
        ref={trackRef}
        tabIndex={0}
        onScroll={measure}
        onKeyDown={onKeyDown}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-0.5 pb-3 pt-1 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}`}
            className={cn("shrink-0 snap-start", slideClassName)}
          >
            {slide}
          </div>
        ))}
      </div>

      {slides.length > 1 ? (
        <div className="mt-1 flex justify-center gap-1.5" aria-hidden>
          {slides.map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === active ? "w-5 bg-[var(--wt-brand)]" : "w-1.5 bg-wt-border-md"
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
