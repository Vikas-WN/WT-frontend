export type SeasonalThemeId = "DIWALI" | "HOLI" | "CHRISTMAS" | "CRICKET";

export interface SeasonalThemeWindow {
  theme: SeasonalThemeId;
  label: string;
  start: string;
  end: string;
  enabled: boolean;
}

/** What HR sees on Settings: the switch, the allowed looks and what is coming up. */
export interface SeasonalThemeSettings {
  enabled: boolean;
  themes: SeasonalThemeId[];
  active: SeasonalThemeId | null;
  upcoming: SeasonalThemeWindow[];
  all_themes: SeasonalThemeId[];
  updated_by: string | null;
}
