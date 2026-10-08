/** Pure helpers for the diagnostics that ride along with a bug report (no app imports, so they are unit-testable). */

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const LONG_TOKEN = /\b[A-Za-z0-9_-]{32,}\b/g;

/** Hide e-mail addresses and long secret-looking strings, then cut to `max` characters. */
export function maskText(text: string, max = 300): string {
  return text.replace(EMAIL, "[email]").replace(LONG_TOKEN, "[token]").slice(0, max);
}

/**
 * An API path made safe to record: no query string, and ids replaced so the same endpoint always reads the same
 * (`/api/v1/leave/123/approve` → `/api/v1/leave/:id/approve`).
 */
export function routeTemplate(path: string): string {
  const [pathname] = path.split("?");
  return pathname
    .replace(/\/\d+(?=\/|$)/g, "/:id")
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, "/:id")
    .replace(/\/[A-Za-z0-9_-]{24,}(?=\/|$)/g, "/:token");
}

/** Add to a list that never grows past `max`: the oldest entries fall off the front. */
export function pushBounded<T>(list: T[], item: T, max: number): void {
  list.push(item);
  if (list.length > max) list.splice(0, list.length - max);
}

/** The page address with anything in the query string that is not a plain value removed — keys stay, values are hidden. */
export function safePageUrl(href: string): string {
  try {
    const url = new URL(href);
    const keys = [...url.searchParams.keys()];
    return `${url.origin}${url.pathname}${keys.length ? `?${keys.map((k) => `${k}=…`).join("&")}` : ""}`;
  } catch {
    return maskText(href, 300);
  }
}
