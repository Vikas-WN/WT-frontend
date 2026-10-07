"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "wt-pet-enabled";
const CHANGED = "wt-pet-changed";

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Whether Knot, the desk pet, is shown. On by default; this browser remembers the choice (it is a personal, per-device thing). */
export function usePetEnabled(): [boolean, (enabled: boolean) => void] {
  const enabled = useSyncExternalStore(subscribe, read, () => true);
  const set = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      /* private mode: the choice only lasts until reload */
    }
    window.dispatchEvent(new Event(CHANGED));
  }, []);
  return [enabled, set];
}
