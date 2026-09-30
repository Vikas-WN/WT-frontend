"use client";

import { useCallback, useState } from "react";
import { RELEASE_NOTES, type ReleaseNote } from "@/constants/releaseNotes";
import {
  WHATS_NEW_LOCAL_STORAGE_KEY,
  WHATS_NEW_MAX_RELEASES,
  WHATS_NEW_PREVIEW_PARAM,
  WHATS_NEW_PREVIEW_VALUE,
} from "@/constants/whatsNew";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { isPreviewRequested, readSeenLocally, releasesToShow, writeSeenLocally } from "@/utils/whatsNew";

function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export interface WhatsNewState {
  /** Releases to announce now, newest first. Empty when there is nothing to show. */
  releases: readonly ReleaseNote[];
  /** Shown from `?whatsNew=preview`: closing it records nothing, so it can be seen again. */
  isPreview: boolean;
  /** The user has read it (Got it, X, Esc or a click outside) — never show these again. */
  dismiss: () => void;
}

/**
 * Decides whether to show the "What's new" dialog, and records that it was read.
 *
 * "Read" is saved on the user's server preferences, so seeing it on one device means seeing
 * it everywhere; a copy in this browser is kept too, so a failed save can never make it nag
 * again. While the saved state is loading — or failed to load, so we can't know — nothing shows.
 */
export function useWhatsNew(enabled: boolean): WhatsNewState {
  const { preferences, isLoading, loadFailed, markReleaseSeen } = useUserPreferences();
  // Read once on mount: the URL parameter and the browser copy are inputs, not things to re-read.
  const [isPreview] = useState(
    () => typeof window !== "undefined" && isPreviewRequested(window.location.search, WHATS_NEW_PREVIEW_PARAM, WHATS_NEW_PREVIEW_VALUE)
  );
  const [localSeen, setLocalSeen] = useState(() => readSeenLocally(browserStorage(), WHATS_NEW_LOCAL_STORAGE_KEY));
  // Closing hides it immediately, without waiting for the save to come back.
  const [closed, setClosed] = useState(false);

  const ready = enabled && !closed && (isPreview || (!isLoading && !loadFailed));
  const releases: readonly ReleaseNote[] = !ready
    ? []
    : isPreview
      ? RELEASE_NOTES.slice(0, 1)
      : releasesToShow(RELEASE_NOTES, [preferences.last_seen_release, localSeen], WHATS_NEW_MAX_RELEASES);

  const newestShown = releases[0]?.id;
  const dismiss = useCallback(() => {
    setClosed(true);
    if (isPreview || !newestShown) return;
    writeSeenLocally(browserStorage(), WHATS_NEW_LOCAL_STORAGE_KEY, newestShown);
    setLocalSeen(newestShown);
    void markReleaseSeen(newestShown).catch(() => undefined); // the browser copy covers a failed save
  }, [isPreview, newestShown, markReleaseSeen]);

  return { releases, isPreview, dismiss };
}
