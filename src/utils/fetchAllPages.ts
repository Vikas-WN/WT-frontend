export type PageResult<Row> = { rows: Row[]; totalPages: number; totalElements: number };

/**
 * Loads every page of a paginated list (capped), for screens that search, sort and page the whole list in the browser.
 *
 * Fetching only page 0 silently drops everything past the first page — the screen then shows a "total" that is just
 * what happened to arrive. Page 0 is fetched first to learn how many pages there are; the rest load in parallel.
 * `truncated` is true when the cap stopped us before the end, so the screen can say so instead of implying completeness.
 */
export async function fetchAllPages<Row>(
  fetchPage: (page: number) => Promise<PageResult<Row>>,
  maxPages = 10
): Promise<{ rows: Row[]; totalElements: number; truncated: boolean }> {
  const first = await fetchPage(0);
  const totalPages = Math.max(1, first.totalPages);
  const lastPage = Math.min(totalPages, Math.max(1, maxPages)) - 1;
  const rest =
    lastPage >= 1 ? await Promise.all(Array.from({ length: lastPage }, (_, i) => fetchPage(i + 1))) : [];
  return {
    rows: [first, ...rest].flatMap((page) => page.rows),
    totalElements: first.totalElements,
    truncated: totalPages > maxPages,
  };
}
