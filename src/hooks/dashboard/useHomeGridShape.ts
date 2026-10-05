"use client";

import { useSyncExternalStore } from "react";

import { HOME_GRID } from "@/constants/homeGrid";

export interface HomeGridShape {
  /** False on phones/tablets, where Home scrolls like any other page. */
  fixed: boolean;
  /** Columns for a given number of grid cells (a wide widget is two cells). */
  columnsFor: (cells: number) => number;
}

const QUERIES = [`(min-width: ${HOME_GRID.desktopMinWidth}px)`, `(min-width: ${HOME_GRID.wideMinWidth}px)`] as const;

function subscribe(onChange: () => void) {
  const lists = QUERIES.map((query) => window.matchMedia(query));
  lists.forEach((list) => list.addEventListener("change", onChange));
  return () => lists.forEach((list) => list.removeEventListener("change", onChange));
}

// A string snapshot keeps useSyncExternalStore referentially stable between reads.
function snapshot(): string {
  return QUERIES.map((query) => (window.matchMedia(query).matches ? "1" : "0")).join("");
}

/** The window's class, so the Home grid can pick columns; rows then follow from how many widgets there are. */
export function useHomeGridShape(): HomeGridShape {
  const key = useSyncExternalStore(subscribe, snapshot, () => "00");
  const wide = key[1] === "1";
  return {
    fixed: key[0] === "1",
    columnsFor: (cells) =>
      wide && cells > HOME_GRID.maxCellsForThreeColumns ? HOME_GRID.columnsWide : HOME_GRID.columnsDesktop,
  };
}

/** Grid cells a widget takes: wide ones span two columns. */
export function cellsOf(items: ReadonlyArray<{ size: "normal" | "wide" }>): number {
  return items.reduce((sum, item) => sum + (item.size === "wide" ? 2 : 1), 0);
}
