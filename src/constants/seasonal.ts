import type { SeasonalThemeId } from "@/types/seasonal";

export const SEASONAL_QUERY_KEYS = {
  current: ["seasonal-theme"] as const,
  admin: ["seasonal-theme", "admin"] as const,
};

export const SEASONAL_THEME_IDS: readonly SeasonalThemeId[] = ["DIWALI", "HOLI", "CHRISTMAS", "CRICKET"];

export const SEASONAL_COPY: Record<SeasonalThemeId, { label: string; greeting: string; blurb: string }> = {
  DIWALI: { label: "Diwali", greeting: "Happy Diwali!", blurb: "A brighter day, good company, and a fresh start." },
  HOLI: { label: "Holi", greeting: "Happy Holi!", blurb: "Make space for a little colour and a lot of good company." },
  CHRISTMAS: { label: "Christmas", greeting: "Merry Christmas!", blurb: "Take a breath, share some warmth, and enjoy the season." },
  CRICKET: { label: "Cricket season", greeting: "It's cricket season!", blurb: "Big moments are better when we cheer together." },
};

/** `?season=diwali` in the address bar previews a look on your own screen only — handy for HR to check one out of season. */
export const SEASON_PREVIEW_PARAM = "season";
