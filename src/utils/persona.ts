/**
 * Header persona switcher — persists the active role across refreshes within a
 * browser session (sessionStorage; cleared on tab close or logout), keyed per user
 * so switching accounts on the same device never leaks a stale persona.
 */
const STORAGE_PREFIX = "webtrak.activePersona.";

function storageKey(email: string): string {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

export function getStoredPersona(email: string): string | null {
  if (typeof window === "undefined" || !email) return null;
  try {
    return window.sessionStorage.getItem(storageKey(email));
  } catch {
    return null;
  }
}

export function setStoredPersona(email: string, role: string): void {
  if (typeof window === "undefined" || !email) return;
  try {
    window.sessionStorage.setItem(storageKey(email), role);
  } catch {
    /* best-effort */
  }
}

export function clearStoredPersona(email: string): void {
  if (typeof window === "undefined" || !email) return;
  try {
    window.sessionStorage.removeItem(storageKey(email));
  } catch {
    /* best-effort */
  }
}
