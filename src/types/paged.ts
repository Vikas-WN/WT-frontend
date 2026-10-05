/** The envelope the list endpoints return when asked for a page (`page` is zero-based). */
export interface Paged<T> {
  items: T[];
  total_elements: number;
  current_page: number;
  total_pages: number;
  page_size: number;
}

/** Query string shared by the paged list endpoints. */
export interface ListParams {
  q?: string;
  category?: string;
  page?: number;
  size?: number;
  /** Show just this item (a deep link from a notification). */
  id?: number;
}

/** Drops empty values so they aren't sent as `q=`. */
export function listQuery(params: Record<string, string | number | boolean | undefined | null>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    out[key] = String(value);
  }
  return out;
}

export const EMPTY_PAGE: Paged<never> = { items: [], total_elements: 0, current_page: 0, total_pages: 1, page_size: 12 };
