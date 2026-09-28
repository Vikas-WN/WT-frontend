"use client";

import { useEffect, useRef, useState, type HTMLAttributes, type CSSProperties } from "react";
import { DEFAULT_TABLE_MAX_HEIGHT } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";

export const SCROLLABLE_TABLE_CLASS = "wt-scrollable-table text-sm";

export const STICKY_TABLE_HEAD_CLASS = "wt-table-sticky-head [&_tr]:border-b";

export const SCROLLABLE_TABLE_SHELL_CLASS =
  "rounded-xl border border-wt-border bg-wt-surface-1/50";

export const SCROLLABLE_TABLE_SHELL_CHAIN_CLASS =
  "rounded-xl border border-wt-border bg-wt-surface-1/50";

type ScrollableTableProps = HTMLAttributes<HTMLDivElement> & {
  maxHeightClass?: string;
  /** Allow scroll to continue on the parent once this region hits its edge. Default on for page tables. */
  scrollChain?: boolean;
  /**
   * `both` (default) — horizontal + vertical.
   * `y` — vertical only (no horizontal scrollbar; table must fit width).
   */
  axis?: "both" | "y";
};

function chainWheelToPageScroll(el: HTMLElement, deltaY: number) {
  if (!deltaY) return false;
  const scrollingDown = deltaY > 0;
  const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
  // Content does not overflow — do not capture the wheel; let the page scroll.
  if (maxScrollTop <= 0) return false;

  const atTop = el.scrollTop <= 0;
  const atBottom = el.scrollTop >= maxScrollTop - 1;
  const blockedAtBoundary = (scrollingDown && atBottom) || (!scrollingDown && atTop);
  if (!blockedAtBoundary) return false;

  const pageScroller = el.closest(".wt-page-scroll") as HTMLElement | null;
  if (!pageScroller) return false;

  pageScroller.scrollBy({ top: deltaY, behavior: "auto" });
  return true;
}

/** Bounded scroll region so table header cells can stick while body scrolls. */
export function ScrollableTable({
  children,
  className = "",
  maxHeightClass = DEFAULT_TABLE_MAX_HEIGHT,
  scrollChain = true,
  axis = "both",
  style,
  ...props
}: ScrollableTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Wide tables scroll sideways on narrow/touch viewports, but nothing about a
  // plain overflow region signals that — a fade on whichever edge still has
  // hidden content, updated as the user scrolls/resizes.
  const [hasMoreRight, setHasMoreRight] = useState(false);
  const [hasMoreLeft, setHasMoreLeft] = useState(false);

  useEffect(() => {
    if (!scrollChain) return;
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      // Prefer vertical intent; ignore mostly-horizontal gestures (trackpad).
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      if (chainWheelToPageScroll(el, event.deltaY)) {
        event.preventDefault();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scrollChain]);

  useEffect(() => {
    if (axis !== "both") return;
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
      setHasMoreLeft(el.scrollLeft > 1);
      setHasMoreRight(el.scrollLeft < maxScrollLeft - 1);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [axis, children]);

  const scrollClass =
    axis === "y"
      ? scrollChain
        ? "wt-scroll-chain overflow-y-auto overflow-x-hidden"
        : "wt-scroll overflow-y-auto overflow-x-hidden"
      : scrollChain
        ? "wt-scroll-both-chain overflow-auto"
        : "wt-scroll-both overflow-auto";

  const shellClass = scrollChain
    ? SCROLLABLE_TABLE_SHELL_CHAIN_CLASS
    : SCROLLABLE_TABLE_SHELL_CLASS;

  const edgeShadows =
    axis === "both"
      ? [
          hasMoreLeft ? "inset 12px 0 12px -12px rgb(0 0 0 / 0.18)" : null,
          hasMoreRight ? "inset -12px 0 12px -12px rgb(0 0 0 / 0.18)" : null,
        ].filter(Boolean)
      : [];

  const mergedStyle: CSSProperties | undefined = {
    ...(scrollChain ? { overscrollBehaviorY: "auto" as const } : null),
    ...style,
    ...(edgeShadows.length
      ? { boxShadow: [style?.boxShadow, ...edgeShadows].filter(Boolean).join(", ") }
      : null),
  };

  return (
    <div
      ref={scrollRef}
      className={cn(shellClass, scrollClass, maxHeightClass, className)}
      style={mergedStyle}
      {...props}
    >
      {children}
    </div>
  );
}
