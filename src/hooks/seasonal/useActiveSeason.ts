"use client";

import { useSearchParams } from "next/navigation";

import { SEASON_PREVIEW_PARAM, SEASONAL_THEME_IDS } from "@/constants/seasonal";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { useSeasonalTheme } from "@/hooks/seasonal/useSeasonalTheme";
import type { SeasonalThemeId } from "@/types/seasonal";

/**
 * The season the app is wearing right now for this person, or null: today's look from the server (HR's switch + the date), unless the
 * person turned the festive look off for themselves. `?season=diwali` in the address previews one on this screen only.
 */
export function useActiveSeason(): SeasonalThemeId | null {
  const { preferences } = useUserPreferences();
  const { data } = useSeasonalTheme();
  const preview = useSearchParams().get(SEASON_PREVIEW_PARAM)?.toUpperCase();
  const previewing = SEASONAL_THEME_IDS.find((id) => id === preview) ?? null;
  if (previewing) return previewing;
  if (!preferences.festive_look) return null;
  const active = data?.active ?? null;
  return SEASONAL_THEME_IDS.find((id) => id === active) ?? null;
}
