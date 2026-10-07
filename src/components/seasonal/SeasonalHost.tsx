"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { SEASON_PREVIEW_PARAM, SEASONAL_THEME_IDS } from "@/constants/seasonal";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { useSeasonalTheme } from "@/hooks/seasonal/useSeasonalTheme";

/**
 * Puts today's seasonal look on the page as `data-season="diwali"` (the CSS does the rest). Nothing renders. The look is
 * only worn when HR has switched it on, the date is inside a festival window and the person has not opted out.
 */
export function SeasonalHost() {
  const { preferences } = useUserPreferences();
  const { data } = useSeasonalTheme();
  const preview = useSearchParams().get(SEASON_PREVIEW_PARAM)?.toUpperCase();
  const previewing = SEASONAL_THEME_IDS.find((id) => id === preview) ?? null;
  const season = (previewing ?? data?.active ?? null)?.toLowerCase() ?? null;
  const wanted = preferences.festive_look || previewing !== null;

  // Side effect: the season is an attribute on <html>, outside React's tree.
  useEffect(() => {
    const root = document.documentElement;
    if (season && wanted) root.dataset.season = season;
    else delete root.dataset.season;
    return () => {
      delete root.dataset.season;
    };
  }, [season, wanted]);

  return null;
}
