"use client";

import { useSyncExternalStore } from "react";

import { HOME_GRID } from "@/constants/homeGrid";

export interface HomeGridShape {
  /** False on phones/tablets, where Home scrolls like any other page. */
  fixed: boolean;
  columns: number;
  rows: number;
}

const QUERIES = [
  `(min-width: ${HOME_GRID.desktopMinWidth}px)`,
  `(min-width: ${HOME_GRID.wideMinWidth}px)`,
  `(min-height: ${HOME_GRID.tallMinHeight}px)`,
] as const;

function subscribe(onChange: () => void) {
  const lists = QUERIES.map((query) => window.matchMedia(query));
  lists.forEach((list) => list.addEventListener("change", onChange));
  return () => lists.forEach((list) => list.removeEventListener("change", onChange));
}

// A string snapshot keeps useSyncExternalStore referentially stable between reads.
function snapshot(): string {
  return QUERIES.map((query) => (window.matchMedia(query).matches ? "1" : "0")).join("");
}

/** How many columns and rows fit the window, so the Home grid can fill it exactly. */
export function useHomeGridShape(): HomeGridShape {
  const key = useSyncExternalStore(subscribe, snapshot, () => "000");
  const [desktop, wide, tall] = [key[0] === "1", key[1] === "1", key[2] === "1"];
  return {
    fixed: desktop,
    columns: wide ? HOME_GRID.columnsWide : HOME_GRID.columnsDesktop,
    rows: tall ? HOME_GRID.rowsTall : HOME_GRID.rowsShort,
  };
}

/** Splits widgets into screens of `columns × rows` cells; a wide widget takes two cells. */
export function paginateWidgets<T extends { size: "normal" | "wide" }>(items: T[], capacity: number, columns: number): T[][] {
  const pages: T[][] = [];
  let current: T[] = [];
  let used = 0;
  for (const item of items) {
    const cells = item.size === "wide" && columns > 1 ? 2 : 1;
    if (used + cells > capacity && current.length > 0) {
      pages.push(current);
      current = [];
      used = 0;
    }
    current.push(item);
    used += cells;
  }
  if (current.length > 0) pages.push(current);
  return pages.length > 0 ? pages : [[]];
}
