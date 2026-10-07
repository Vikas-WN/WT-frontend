import type { SeasonalThemeId } from "@/types/seasonal";

export const SEASONAL_QUERY_KEYS = {
  current: ["seasonal-theme"] as const,
  admin: ["seasonal-theme", "admin"] as const,
};

export const SEASONAL_THEME_IDS: readonly SeasonalThemeId[] = ["DIWALI", "HOLI", "CHRISTMAS", "CRICKET"];

export const SEASONAL_COPY: Record<SeasonalThemeId, { label: string; greeting: string; blurb: string }> = {
  DIWALI: { label: "Diwali", greeting: "Happy Diwali!", blurb: "Warm golden lights across WebTrak." },
  HOLI: { label: "Holi", greeting: "Happy Holi!", blurb: "A splash of colour for the festival." },
  CHRISTMAS: { label: "Christmas", greeting: "Merry Christmas!", blurb: "A little winter sparkle." },
  CRICKET: { label: "Cricket season", greeting: "It's cricket season!", blurb: "Green-and-blue match-day mood." },
};

/** `?season=diwali` in the address bar previews a look on your own screen only — handy for HR to check one out of season. */
export const SEASON_PREVIEW_PARAM = "season";
