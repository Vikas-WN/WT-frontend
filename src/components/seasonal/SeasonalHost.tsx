"use client";

import { useEffect } from "react";

import { SeasonalDecor } from "@/components/seasonal/SeasonalDecor";
import { useActiveSeason } from "@/hooks/seasonal/useActiveSeason";

/**
 * Puts today's seasonal look on the page as `data-season="diwali"` (the CSS does the rest) and renders the festive artwork — edges
 * only, never clickable. The look is only worn when HR has switched it on, the date is inside a festival window and the person has
 * not opted out.
 */
export function SeasonalHost() {
  const season = useActiveSeason();

  // Side effect: the season is an attribute on <html>, outside React's tree.
  useEffect(() => {
    const root = document.documentElement;
    if (season) root.dataset.season = season.toLowerCase();
    else delete root.dataset.season;
    return () => {
      delete root.dataset.season;
    };
  }, [season]);

  return season ? <SeasonalDecor season={season} /> : null;
}
