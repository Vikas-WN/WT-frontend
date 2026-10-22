"use client";
import { useCallback, useSyncExternalStore } from "react";
const EVENT = "wt:sidebar-layout";
let memory = false;
function subscribe(update: () => void) {
  window.addEventListener(EVENT, update);
  window.addEventListener("storage", update);
  return () => { window.removeEventListener(EVENT, update); window.removeEventListener("storage", update); };
}
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, () => { try { return localStorage.getItem("wt-sidebar-collapsed") === "1"; } catch { return memory; } }, () => false);
  const set = useCallback((value: boolean) => { memory = value; try { localStorage.setItem("wt-sidebar-collapsed", value ? "1" : "0"); } catch { /* device storage unavailable */ } window.dispatchEvent(new Event(EVENT)); }, []);
  return [collapsed, set] as const;
}
