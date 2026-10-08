"use client";

import { useSyncExternalStore } from "react";

import { INSTALLED_DISPLAY_MODES } from "@/constants/appNavigation";

const QUERIES = INSTALLED_DISPLAY_MODES.map((mode) => `(display-mode: ${mode})`);

function isInstalled(): boolean {
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true; // iOS home-screen apps
  return QUERIES.some((q) => window.matchMedia(q).matches);
}

function subscribe(onChange: () => void): () => void {
  const lists = QUERIES.map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener("change", onChange));
  return () => lists.forEach((l) => l.removeEventListener("change", onChange));
}

/** True when WebTrak is running as an installed app (no browser toolbar), false in a normal tab and on the server. */
export function useInstalledApp(): boolean {
  return useSyncExternalStore(subscribe, isInstalled, () => false);
}
