/**
 * Which "What's new" releases a user should be shown. Pure — no React, no app imports — so the
 * rules can be unit-tested on their own.
 *
 * Release ids sort chronologically as plain strings (see constants/releaseNotes.ts), so "newer
 * than what you have seen" is just a string comparison. That also makes it safe against a
 * rollback or a different environment: an id this build has never heard of is simply compared.
 */

export interface ReleaseLike {
  id: string;
}

/** Storage-like, so the local copy of "seen" is testable without a browser. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function clean(id: string | null | undefined): string | null {
  const trimmed = (id ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

/** The newest release id the user is known to have read, from whichever source has one. */
export function newestSeenId(...sources: Array<string | null | undefined>): string | null {
  let newest: string | null = null;
  for (const source of sources) {
    const id = clean(source);
    if (id !== null && (newest === null || id > newest)) newest = id;
  }
  return newest;
}

/**
 * The releases to announce, newest first.
 *
 * - Someone who has read nothing sees only the latest release, not the whole history.
 * - Someone who has read some sees every release newer than that (capped), so an update skipped
 *   is not lost.
 * - Someone up to date sees nothing.
 */
export function releasesToShow<T extends ReleaseLike>(
  releases: readonly T[],
  seen: ReadonlyArray<string | null | undefined>,
  maxShown: number
): T[] {
  const newestFirst = [...releases].sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  if (newestFirst.length === 0 || maxShown < 1) return [];
  const seenId = newestSeenId(...seen);
  if (seenId === null) return [newestFirst[0]];
  return newestFirst.filter((release) => release.id > seenId).slice(0, maxShown);
}

export function isPreviewRequested(search: string, param: string, value: string): boolean {
  try {
    return new URLSearchParams(search).get(param) === value;
  } catch {
    return false;
  }
}

/** The local copy of "seen". Storage can be blocked or full, so neither call may throw. */
export function readSeenLocally(storage: StorageLike | null, key: string): string | null {
  try {
    return clean(storage?.getItem(key));
  } catch {
    return null;
  }
}

export function writeSeenLocally(storage: StorageLike | null, key: string, id: string): void {
  try {
    const current = readSeenLocally(storage, key);
    // Only ever move forward: a stale tab must not make a newer "seen" go backwards.
    if (current === null || id > current) storage?.setItem(key, id);
  } catch {
    /* storage unavailable — the server copy still records it */
  }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** "30 Sep 2026" from an ISO date. Built by hand, not Intl: month spellings differ between runtimes
 *  ("Sept" vs "Sep"), and the viewer's timezone must never shift the day. */
export function formatReleaseDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return isoDate;
  return `${Number(match[3])} ${month} ${match[1]}`;
}
