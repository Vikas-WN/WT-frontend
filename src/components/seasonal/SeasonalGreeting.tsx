"use client";

import { Flame, Palette, Snowflake, Trophy } from "lucide-react";
import type { ComponentType } from "react";

import { SEASONAL_COPY } from "@/constants/seasonal";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { useSeasonalTheme } from "@/hooks/seasonal/useSeasonalTheme";
import type { SeasonalThemeId } from "@/types/seasonal";

const ICONS: Record<SeasonalThemeId, ComponentType<{ className?: string }>> = {
  DIWALI: Flame,
  HOLI: Palette,
  CHRISTMAS: Snowflake,
  CRICKET: Trophy,
};

/** A slim, friendly line at the top of Home during a festival window — the one place the season says hello in words. */
export function SeasonalGreeting() {
  const { preferences } = useUserPreferences();
  const { data } = useSeasonalTheme();
  const theme = (data?.active ?? null) as SeasonalThemeId | null;
  if (!theme || !preferences.festive_look || !(theme in SEASONAL_COPY)) return null;
  const Icon = ICONS[theme];
  const copy = SEASONAL_COPY[theme];
  return (
    <div className="wt-season-greeting flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm" role="note">
      <span className="wt-season-icon flex size-8 shrink-0 items-center justify-center rounded-xl">
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="min-w-0">
        <span className="font-semibold text-wt-text">{copy.greeting}</span>{" "}
        <span className="text-wt-text-muted">{copy.blurb}</span>
      </p>
    </div>
  );
}
