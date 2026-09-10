const STORAGE_KEY = "wt-sidebar-collapsed";

/** The dashboard sidebar defaults to collapsed (icon rail). Users may still
 *  expand it; the choice is remembered per browser. */
export function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function writeSidebarCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "true" : "false");
  } catch {
    /* ignore */
  }
}
