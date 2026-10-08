/**
 * Where we are in the tab's history, for browsers without the Navigation API (iOS Safari). Every entry we see gets a number
 * stamped into `history.state`; going back or forward lands on an entry that already has one, so we can tell the two apart
 * and know whether there is anything behind or ahead.
 */
export interface HistoryPosition {
  /** This entry's number. */
  index: number;
  /** The highest entry number reachable by going forward. */
  max: number;
}

export interface HistoryStep {
  position: HistoryPosition;
  /** A number to stamp onto the entry when it did not have one yet (a fresh navigation), else null. */
  stamp: number | null;
}

/** `stateIndex` is the number already on the current entry, if any; `previous` is where we were before. */
export function stepHistory(previous: HistoryPosition | null, stateIndex: number | undefined): HistoryStep {
  if (stateIndex === undefined) {
    // A fresh entry: it sits right after the one we were on, and everything that used to be ahead of it is gone.
    const index = previous ? previous.index + 1 : 0;
    return { position: { index, max: index }, stamp: index };
  }
  // An entry we stamped earlier: we got here by going back or forward (or by reloading).
  const max = Math.max(previous?.max ?? stateIndex, stateIndex);
  return { position: { index: stateIndex, max }, stamp: null };
}

export const canGoBackFrom = (p: HistoryPosition | null): boolean => (p?.index ?? 0) > 0;
export const canGoForwardFrom = (p: HistoryPosition | null): boolean => (p ? p.index < p.max : false);
