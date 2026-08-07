export type ThemePreference = "light" | "dark" | "system";
export type DensityPreference = "comfortable" | "compact";
export type WeekStartPreference = "monday" | "sunday";
export type DateFormatPreference = "DMY" | "MDY" | "YMD";

export type UserPreferences = {
  timezone: string;
  theme: ThemePreference;
  density: DensityPreference;
  reduce_motion: boolean;
  email_notifications: boolean;
  desktop_notifications: boolean;
  week_starts_on: WeekStartPreference;
  date_format: DateFormatPreference;
};

export type UserPreferencesUpdate = Partial<UserPreferences>;

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  timezone: "Asia/Kolkata",
  theme: "system",
  density: "comfortable",
  reduce_motion: false,
  email_notifications: true,
  desktop_notifications: true,
  week_starts_on: "monday",
  date_format: "DMY",
};

/** Curated IANA zones for the settings picker (API accepts any valid zone). */
export const COMMON_TIMEZONES: Array<{ value: string; label: string }> = [
  { value: "Asia/Kolkata", label: "India (Asia/Kolkata)" },
  { value: "Asia/Dubai", label: "Dubai (Asia/Dubai)" },
  { value: "Asia/Singapore", label: "Singapore (Asia/Singapore)" },
  { value: "Asia/Tokyo", label: "Tokyo (Asia/Tokyo)" },
  { value: "Asia/Shanghai", label: "Shanghai (Asia/Shanghai)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (Asia/Hong_Kong)" },
  { value: "Europe/London", label: "London (Europe/London)" },
  { value: "Europe/Paris", label: "Paris (Europe/Paris)" },
  { value: "Europe/Berlin", label: "Berlin (Europe/Berlin)" },
  { value: "America/New_York", label: "New York (America/New_York)" },
  { value: "America/Chicago", label: "Chicago (America/Chicago)" },
  { value: "America/Denver", label: "Denver (America/Denver)" },
  { value: "America/Los_Angeles", label: "Los Angeles (America/Los_Angeles)" },
  { value: "America/Toronto", label: "Toronto (America/Toronto)" },
  { value: "Australia/Sydney", label: "Sydney (Australia/Sydney)" },
  { value: "Pacific/Auckland", label: "Auckland (Pacific/Auckland)" },
  { value: "UTC", label: "UTC" },
];
