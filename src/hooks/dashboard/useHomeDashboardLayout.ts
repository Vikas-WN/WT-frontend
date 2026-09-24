"use client";

import { useCallback, useEffect, useState } from "react";

export type WidgetSize = "normal" | "wide";
export type WidgetLayoutItem = { id: string; size: WidgetSize; hidden: boolean };

const STORAGE_KEY = "wt-home-dashboard-layout-v1";

function isWidgetLayoutItem(value: unknown): value is WidgetLayoutItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    (item.size === "normal" || item.size === "wide") &&
    typeof item.hidden === "boolean"
  );
}

function readStoredLayout(): WidgetLayoutItem[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isWidgetLayoutItem);
  } catch {
    return null;
  }
}

function writeStoredLayout(layout: WidgetLayoutItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Private browsing / blocked storage — the layout just won't persist.
  }
}

function defaultLayout(defaultOrder: readonly string[]): WidgetLayoutItem[] {
  return defaultOrder.map((id) => ({ id, size: "normal", hidden: false }));
}

/** Merges saved layout with the current widget catalog: keeps the saved
 *  order/size/hidden for ids that still exist, drops ids that no longer do,
 *  and appends any new widget ids (shipped after the user last customized)
 *  at the end, visible by default. */
function reconcile(defaultOrder: readonly string[], saved: WidgetLayoutItem[] | null): WidgetLayoutItem[] {
  if (!saved || saved.length === 0) return defaultLayout(defaultOrder);
  const knownIds = new Set(defaultOrder);
  const savedIds = new Set(saved.map((item) => item.id));
  const result = saved.filter((item) => knownIds.has(item.id));
  for (const id of defaultOrder) {
    if (!savedIds.has(id)) result.push({ id, size: "normal", hidden: false });
  }
  return result;
}

/** Per-browser, drag-to-reorder / resize / show-hide layout for the Home
 *  dashboard's widget grid. Persisted to localStorage — a personal device
 *  preference, not shared state, so it doesn't need a backend round-trip. */
export function useHomeDashboardLayout(defaultOrder: readonly string[]) {
  const [layout, setLayout] = useState<WidgetLayoutItem[]>(() => defaultLayout(defaultOrder));

  useEffect(() => {
    setLayout(reconcile(defaultOrder, readStoredLayout()));
    // Only re-reconcile if the widget catalog itself changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultOrder.join(",")]);

  const persist = useCallback((next: WidgetLayoutItem[]) => {
    setLayout(next);
    writeStoredLayout(next);
  }, []);

  const reorder = useCallback(
    (draggedId: string, targetId: string) => {
      if (draggedId === targetId) return;
      setLayout((prev) => {
        const from = prev.findIndex((w) => w.id === draggedId);
        const to = prev.findIndex((w) => w.id === targetId);
        if (from === -1 || to === -1) return prev;
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        writeStoredLayout(next);
        return next;
      });
    },
    []
  );

  const toggleSize = useCallback(
    (id: string) => {
      setLayout((prev) => {
        const next = prev.map((w) =>
          w.id === id ? { ...w, size: (w.size === "wide" ? "normal" : "wide") as WidgetSize } : w
        );
        writeStoredLayout(next);
        return next;
      });
    },
    []
  );

  const setHidden = useCallback((id: string, hidden: boolean) => {
    setLayout((prev) => {
      const next = prev.map((w) => (w.id === id ? { ...w, hidden } : w));
      writeStoredLayout(next);
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => {
    persist(defaultLayout(defaultOrder));
    // Depend on the joined ids (a stable primitive), not the `defaultOrder`
    // array reference itself, which callers typically pass as a new literal
    // on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultOrder.join(","), persist]);

  return { layout, reorder, toggleSize, setHidden, resetLayout };
}
