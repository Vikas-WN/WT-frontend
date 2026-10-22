export const DATA_CHANGED = "wt:data-changed";
export const DATA_REVISION_KEY = "wt-data-revision";
/** Successful writes invalidate live counts, including other tabs on this device. */
export function announceDataChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DATA_CHANGED));
  try { localStorage.setItem(DATA_REVISION_KEY, String(Date.now())); } catch { /* same-tab event still works */ }
}
