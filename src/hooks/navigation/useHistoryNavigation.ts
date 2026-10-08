"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { HISTORY_INDEX_KEY, HISTORY_POSITION_STORAGE_KEY } from "@/constants/appNavigation";
import { canGoBackFrom, canGoForwardFrom, stepHistory, type HistoryPosition } from "@/utils/historyPosition";

interface NavigationApi {
  canGoBack: boolean;
  canGoForward: boolean;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

interface Availability {
  back: boolean;
  forward: boolean;
}

const NONE: Availability = { back: false, forward: false };

// The browser does not tell us directly whether there is a page behind or ahead, so this tiny store holds the answer.
let current: Availability = NONE;
const listeners = new Set<() => void>();

function publish(next: Availability): void {
  if (next.back === current.back && next.forward === current.forward) return;
  current = next;
  listeners.forEach((listener) => listener());
}

function navigationApi(): NavigationApi | null {
  return (window as unknown as { navigation?: NavigationApi }).navigation ?? null;
}

function readFromNavigationApi(nav: NavigationApi): void {
  publish({ back: nav.canGoBack, forward: nav.canGoForward });
}

function subscribe(listener: () => void): () => void {
  const nav = navigationApi();
  if (nav) {
    // Chromium and recent Safari: ask the browser, and listen for every move.
    const onMove = () => readFromNavigationApi(nav);
    readFromNavigationApi(nav);
    nav.addEventListener("currententrychange", onMove);
    listeners.add(listener);
    return () => {
      nav.removeEventListener("currententrychange", onMove);
      listeners.delete(listener);
    };
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readPosition(): HistoryPosition | null {
  try {
    const raw = window.sessionStorage.getItem(HISTORY_POSITION_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<HistoryPosition>) : null;
    return parsed && Number.isFinite(parsed.index) && Number.isFinite(parsed.max) ? (parsed as HistoryPosition) : null;
  } catch {
    return null;
  }
}

function writePosition(position: HistoryPosition): void {
  try {
    window.sessionStorage.setItem(HISTORY_POSITION_STORAGE_KEY, JSON.stringify(position));
  } catch {
    /* storage can be blocked; the buttons then rely on what this page load has seen */
  }
}

/** Without the Navigation API (older iOS): number each history entry ourselves and work out the direction from that. */
function trackWithoutNavigationApi(): void {
  const state = (window.history.state ?? {}) as Record<string, unknown>;
  const stateIndex = typeof state[HISTORY_INDEX_KEY] === "number" ? (state[HISTORY_INDEX_KEY] as number) : undefined;
  const step = stepHistory(readPosition(), stateIndex);
  if (step.stamp !== null) window.history.replaceState({ ...state, [HISTORY_INDEX_KEY]: step.stamp }, "");
  writePosition(step.position);
  publish({ back: canGoBackFrom(step.position), forward: canGoForwardFrom(step.position) });
}

/** Back / Forward / Refresh for the app's own toolbar, with whether there is anywhere to go. */
export function useHistoryNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const available = useSyncExternalStore(subscribe, () => current, () => NONE);
  // UI state: the refresh icon spins from the click until the page reloads.
  const [refreshing, setRefreshing] = useState(false);

  // Side effect: on every page change, update the numbering when the browser has no Navigation API.
  useEffect(() => {
    if (!navigationApi()) trackWithoutNavigationApi();
  }, [pathname, search]);

  const back = useCallback(() => router.back(), [router]);
  const forward = useCallback(() => router.forward(), [router]);
  const refresh = useCallback(() => {
    setRefreshing(true);
    window.location.reload();
  }, []);

  return { canGoBack: available.back, canGoForward: available.forward, refreshing, back, forward, refresh };
}
